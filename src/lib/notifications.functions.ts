import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

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