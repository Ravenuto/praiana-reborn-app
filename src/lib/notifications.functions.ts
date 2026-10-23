import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { notificationChannels, isDeliverableStudent } from '@/lib/studentNotifPrefs';
import { z } from 'zod';

type WaitlistPromotionEmailInput = {
  bookingId: string;
};

export const sendWaitlistPromotionEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: WaitlistPromotionEmailInput) => {
    if (!input?.bookingId) throw new Error('Reserva inválida.');
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: auth, error: authError } = await context.supabase.auth.getUser();
    if (authError || auth.user?.id !== context.userId) throw new Error('Acesso não autorizado.');
    const { data: booking, error } = await context.supabase.from('app_records')
      .select('id, owner_id, data')
      .eq('id', data.bookingId)
      .eq('collection', 'Booking')
      .maybeSingle();
    const details = booking?.data as Record<string, unknown> | undefined;
    if (error || !booking) throw new Error('Reserva não encontrada.');
    const studentEmail = String(details?.student_email || '');
    const classType = String(details?.class_type_name || 'Aula');
    const sessionDate = String(details?.session_date || '');
    const sessionTime = String(details?.session_time || '');
    if (!studentEmail || !sessionDate || !sessionTime || !details?.from_waitlist_entry_id) throw new Error('Reserva da fila inválida.');
    const { data: isStaff } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    const { data: isTeacher } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'teacher' });
    if (!isStaff && !isTeacher) {
      const sourceBookingId = String(details?.promotion_source_booking_id || '');
      const { data: source } = await context.supabase.from('app_records')
        .select('owner_id')
        .eq('id', sourceBookingId)
        .eq('collection', 'Booking')
        .maybeSingle();
      if (!source || source.owner_id !== context.userId) throw new Error('Acesso não autorizado.');
    }
    const { data: recipient } = await context.supabase.from('profiles').select('data').ilike('email', studentEmail).maybeSingle();
    if (!notificationChannels((recipient?.data as Record<string, unknown>)?.notification_delivery).email) return { sent: false, reason: 'preference' };
    const { sendTemplateEmail } = await import('@/lib/email-templates/send-email');
    return sendTemplateEmail('waitlist-promoted', studentEmail, {
      templateData: {
        studentName: String(details?.student_name || 'Aluna'),
        classType,
        classDate: new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' }).format(new Date(`${sessionDate}T12:00:00Z`)),
        classTime: sessionTime,
        appUrl: 'https://praianapoledance-app.com.br/minhas-reservas',
      },
      idempotencyKey: `waitlist-promoted-${data.bookingId}`,
    });
  });

// Notifications are often created by the studio, so their record owner is not the recipient.
// Verify the recipient before changing only their notification state.
export const updateMyNotifications = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { action: 'readAll' | 'readOne' | 'deleteOne'; id?: string }) => {
    if (!['readAll', 'readOne', 'deleteOne'].includes(input?.action)) throw new Error('Ação inválida');
    if (input.action !== 'readAll' && (!input.id || typeof input.id !== 'string')) throw new Error('Notificação inválida');
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: auth, error: authError } = await context.supabase.auth.getUser();
    const email = auth.user?.email?.toLowerCase();
    if (authError || !email || auth.user?.id !== context.userId) throw new Error('Acesso não autorizado');

    const { data: rows, error } = await context.supabase.from('app_records')
      .select('id, data')
      .eq('collection', 'Notification')
      .filter('data->>user_email', 'ilike', email);
    if (error) throw error;
    const matches = (rows || []).filter((row) =>
      String((row.data as { user_email?: string })?.user_email || '').toLowerCase() === email &&
      (data.action === 'readAll' ? (row.data as { read?: boolean })?.read !== true : row.id === data.id),
    );
    if (data.action !== 'readAll' && matches.length !== 1) throw new Error('Notificação não encontrada');
    if (!matches.length) return { ok: true };

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    for (const row of matches) {
      const result = data.action === 'deleteOne'
        ? await supabaseAdmin.from('app_records').delete().eq('id', row.id).eq('collection', 'Notification')
        : await supabaseAdmin.from('app_records').update({ data: { ...(row.data as Record<string, unknown>), read: true } }).eq('id', row.id).eq('collection', 'Notification');
      if (result.error) throw result.error;
    }
    return { ok: true };
  });
// Renewal email: only administrators can trigger it, and details are read from the saved profile.
export const sendPlanRenewedEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { studentId: string }) => {
    if (!input?.studentId || typeof input.studentId !== 'string') throw new Error('Aluna inválida.');
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!isAdmin) throw new Error('Acesso não autorizado.');
    const { data: profile, error } = await context.supabase.from('profiles')
      .select('id, email, full_name, data').eq('id', data.studentId).maybeSingle();
    if (error || !profile?.email) throw new Error('Aluna não encontrada.');
    const details = (profile.data || {}) as Record<string, unknown>;
    if (!notificationChannels(details.notification_delivery).email) return { sent: false, reason: 'preference' };
    const planKey = String(details.plan || '');
    const { data: planRows } = await context.supabase.from('app_records')
      .select('data').eq('collection', 'StudioPlan').filter('data->>key', 'eq', planKey).limit(1);
    const planLabel = String((planRows?.[0]?.data as { label?: string })?.label || planKey.replace(/_/g, ' '));
    const br = (iso: unknown) => {
      const s = String(iso || '').slice(0, 10);
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split('-').reverse().join('/') : '';
    };
    const start = String(details.plan_start_date || '').slice(0, 10);
    const { sendTemplateEmail } = await import('@/lib/email-templates/send-email');
    return sendTemplateEmail('plan-renewed', profile.email, {
      templateData: {
        studentName: (profile.full_name || 'Aluna').trim().split(' ')[0],
        planName: planLabel,
        renewedOn: br(start),
        credits: Number(details.credits ?? 0),
        validUntil: br(details.plan_end_date),
        appUrl: 'https://praianapoledance-app.com.br/agenda',
      },
      idempotencyKey: `plan-renewed-${profile.id}-${start}-${planKey}`,
    });
  });

export const notifyWaitlistEntered = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ entryId: z.string().min(1).max(100) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: entry, error } = await context.supabase.from('app_records').select('id, owner_id, data').eq('collection', 'WaitlistEntry').eq('id', data.entryId).single();
    if (error || entry.owner_id !== context.userId) throw new Error('Fila não encontrada.');
    const details = entry.data as Record<string, unknown>;
    const { data: profile, error: profileError } = await context.supabase.from('profiles').select('email, data').eq('id', context.userId).single();
    if (profileError || profile.email.toLowerCase() !== String(details.student_email).toLowerCase()) throw new Error('Acesso não autorizado.');
    const channels = notificationChannels((profile.data as Record<string, unknown>).notification_delivery);
    const date = String(details.session_date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Data inválida.');
    if (channels.app) {
      const id = `waitlist-entered-${entry.id}`;
      const { error: insertError } = await context.supabase.from('app_records').upsert({ id, collection: 'Notification', owner_id: context.userId, data: { user_email: profile.email, type: 'waitlist_entered', title: 'Você está na fila de espera!', message: `${details.class_type_name} — ${date.split('-').reverse().join('/')} às ${details.session_time}. Seu crédito ficou reservado.`, link: '/aulas', read: false } }, { onConflict: 'id', ignoreDuplicates: true });
      if (insertError) throw insertError;
    }
    if (!channels.email) return { sent: false, reason: 'preference' };
    const { data: settings } = await context.supabase.from('app_records').select('data').eq('collection', 'StudioSettings').eq('data->>key', 'booking_min_hours').maybeSingle();
    const { sendTemplateEmail } = await import('@/lib/email-templates/send-email');
    return sendTemplateEmail('waitlist-entered', profile.email, { templateData: { studentName: details.student_name || 'Aluna', classType: details.class_type_name, classTime: details.session_time, classDate: new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)), bookingHours: Number((settings?.data as Record<string, unknown>)?.value || 4) }, idempotencyKey: `waitlist-entered-${entry.id}` });
  });

export const cancelStudioParticipant = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ recordId: z.string().min(1).max(100), collection: z.enum(['Booking', 'WaitlistEntry']) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: admin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    const { data: teacher } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'teacher' });
    if (!admin && !teacher) throw new Error('Acesso não autorizado.');
    const { data: row, error } = await context.supabase.from('app_records').select('id, owner_id, data').eq('id', data.recordId).eq('collection', data.collection).single();
    if (error) throw error;
    const d = row.data as Record<string, unknown>;
    const returned = data.collection === 'Booking' ? d.credit_debited === true : d.credit_held === true;
    const result = data.collection === 'Booking'
      ? await context.supabase.from('app_records').update({ data: { ...d, status: 'cancelada', studio_cancelled: true } }).eq('id', row.id)
      : await context.supabase.from('app_records').delete().eq('id', row.id);
    if (result.error) throw result.error;
    if (!isDeliverableStudent(d.student_email, d.guest_type)) return { cancelled: true, sent: false };
    const { data: profile } = await context.supabase.from('profiles').select('id, email, data').eq('email', String(d.student_email)).maybeSingle();
    if (!profile) return { cancelled: true, sent: false };
    const channels = notificationChannels((profile.data as Record<string, unknown>).notification_delivery);
    if (channels.app) {
      const { error: noticeError } = await context.supabase.from('app_records').upsert({ id: `class-cancelled-${row.id}`, collection: 'Notification', owner_id: context.userId, data: { user_email: profile.email, type: 'schedule_change', title: 'Aula cancelada pelo estúdio', message: `${d.class_type_name} — ${String(d.session_date).split('-').reverse().join('/')} às ${d.session_time}.${returned ? ' Seu crédito foi devolvido.' : ''}`, link: '/aulas', read: false } }, { onConflict: 'id', ignoreDuplicates: true });
      if (noticeError) throw noticeError;
    }
    if (!channels.email) return { cancelled: true, sent: false };
    try {
      const { sendTemplateEmail } = await import('@/lib/email-templates/send-email');
      const sent = await sendTemplateEmail('class-cancelled', profile.email, { templateData: { studentName: d.student_name, classType: d.class_type_name, classDate: String(d.session_date).split('-').reverse().join('/'), classTime: d.session_time, creditReturned: returned }, idempotencyKey: `class-cancelled-${row.id}` });
      return { cancelled: true, ...sent };
    } catch { return { cancelled: true, sent: false, reason: 'delivery_failed' }; }
  });
