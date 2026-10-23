import { createFileRoute } from '@tanstack/react-router'
import { timingSafeEqual } from 'node:crypto'
import { notificationChannels, isDeliverableStudent } from '@/lib/studentNotifPrefs'
import { todayInBahia, bahiaClock, addDaysIso, brDateLabel, timeHasPassed } from '@/lib/cronDates'

// Hourly backstop called by pg_cron. Sends: waitlist-closure notices,
// same-day class reminders and plan-expiry notices.
// The caller token lives only in the database (locked table); it is never
// exposed to the browser and never hard-coded here.
// Idempotent: every send carries an idempotency key and rows are marked after handling.
export const Route = createFileRoute('/api/public/hooks/email-backstop')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { sendTemplateEmail } = await import('@/lib/email-templates/send-email');

        // Verify the caller with a server-only token stored in a locked table.
        // cron_tokens stays out of the generated Database types on purpose (infra table).
        const tokens = supabaseAdmin.from('cron_tokens' as never) as unknown as {
          select: (cols: string) => {
            eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: { token: string } | null }> };
          };
        };
        const { data: tokenRow } = await tokens.select('token').eq('key', 'email_backstop').maybeSingle();
        const expected = String(tokenRow?.token || '');
        const received = request.headers.get('x-cron-token') || '';
        const a = Buffer.from(expected);
        const b = Buffer.from(received);
        if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const summary = { expired: 0, waitlistClosed: 0, classReminders: 0, planExpiring: 0, errors: 0 };
        const profileCache = new Map<string, { id: string; email: string; data: Record<string, unknown> } | null>();

        const loadProfile = async (email: string) => {
          const key = email.toLowerCase();
          if (!profileCache.has(key)) {
            const { data } = await supabaseAdmin.from('profiles').select('id, email, data').ilike('email', email).maybeSingle();
            profileCache.set(key, data ? { id: String(data.id), email: String(data.email), data: (data.data || {}) as Record<string, unknown> } : null);
          }
          return profileCache.get(key) || null;
        };

        // 0) Release waitlist holds for classes that closed (same function the agenda triggers).
        try {
          const { data: released } = await supabaseAdmin.rpc('expire_waitlist_holds');
          summary.expired = Number(released) || 0;
        } catch {
          summary.errors += 1;
        }

        // 1) Waitlist closed: email students whose credit was returned and not yet notified by email.
        try {
          const { data: notices } = await supabaseAdmin.from('app_records')
            .select('id, data')
            .eq('collection', 'Notification')
            .or("data->>'source'.eq.waitlist_expiry,data->>'email_sent'.neq.true")
            .limit(50);
          for (const notice of notices || []) {
            const d = (notice.data || {}) as Record<string, unknown>;
            if (d.source !== 'waitlist_expiry' || d.email_sent === true) continue;
            try {
              const email = String(d.user_email || '');
              if (isDeliverableStudent(email, d.guest_type)) {
                const profile = await loadProfile(email);
                if (profile && notificationChannels(profile.data.notification_delivery).email) {
                  await sendTemplateEmail('waitlist-closed', email, {
                    templateData: {
                      studentName: String(d.student_name || 'Aluna'),
                      classType: String(d.class_type_name || 'Aula'),
                      classDate: brDateLabel(d.session_date),
                      classTime: String(d.session_time || ''),
                    },
                    idempotencyKey: `waitlist-closed-${notice.id}`,
                  });
                }
              }
              await supabaseAdmin.from('app_records')
                .update({ data: { ...d, email_sent: true } })
                .eq('id', notice.id).eq('collection', 'Notification');
              summary.waitlistClosed += 1;
            } catch {
              summary.errors += 1; // left unmarked so the next run retries
            }
          }
        } catch {
          summary.errors += 1;
        }

        // 2) Class reminders: confirmed bookings for today (studio time), sent from 07:00 before the class starts.
        try {
          const today = todayInBahia();
          const nowClock = bahiaClock();
          if (nowClock >= '07:00') {
            const { data: bookings } = await supabaseAdmin.from('app_records')
              .select('id, data')
              .eq('collection', 'Booking')
              .filter("data->>'status'", 'eq', 'confirmada')
              .filter("data->>'session_date'", 'eq', today)
              .limit(200);
            for (const booking of bookings || []) {
              const d = (booking.data || {}) as Record<string, unknown>;
              if (d.class_reminder_sent === true) continue;
              if (!isDeliverableStudent(d.student_email, d.guest_type) || timeHasPassed(d.session_time, nowClock)) {
                await supabaseAdmin.from('app_records')
                  .update({ data: { ...d, class_reminder_sent: true } })
                  .eq('id', booking.id).eq('collection', 'Booking');
                continue;
              }
              try {
                const email = String(d.student_email || '');
                const profile = await loadProfile(email);
                const channels = profile ? notificationChannels(profile.data.notification_delivery) : { email: true, app: false };
                if (channels.email) {
                  await sendTemplateEmail('class-reminder', email, {
                    templateData: {
                      studentName: String(d.student_name || 'Aluna'),
                      classType: String(d.class_type_name || 'Aula'),
                      classDate: brDateLabel(d.session_date),
                      classTime: String(d.session_time || ''),
                    },
                    idempotencyKey: `class-reminder-${booking.id}`,
                  });
                }
                if (profile && channels.app) {
                  await supabaseAdmin.from('app_records').upsert({
                    id: `class-reminder-${booking.id}`,
                    collection: 'Notification',
                    owner_id: profile.id,
                    data: {
                      user_email: email, type: 'class_reminder',
                      title: 'Hoje é dia de aula!',
                      message: `${d.class_type_name} — ${brDateLabel(d.session_date)} às ${d.session_time}. Te esperamos no estúdio!`,
                      link: '/minhas-reservas', read: false,
                    },
                  }, { onConflict: 'id', ignoreDuplicates: true });
                }
                await supabaseAdmin.from('app_records')
                  .update({ data: { ...d, class_reminder_sent: true } })
                  .eq('id', booking.id).eq('collection', 'Booking');
                summary.classReminders += 1;
              } catch {
                summary.errors += 1;
              }
            }
          }
        } catch {
          summary.errors += 1;
        }

        // 3) Plan expiring: notice 7 days before plan_end_date.
        try {
          const target = addDaysIso(todayInBahia(), 7);
          const { data: profiles } = await supabaseAdmin.from('profiles')
            .select('id, email, full_name, is_active, data')
            .filter("data->>'plan_end_date'", 'eq', target)
            .limit(100);
          const planKeys = [...new Set((profiles || []).map((p) => String((p.data as Record<string, unknown>)?.plan || '')))].filter(Boolean);
          const planLabels = new Map<string, string>();
          if (planKeys.length) {
            const { data: plans } = await supabaseAdmin.from('app_records')
              .select('data').eq('collection', 'StudioPlan').filter('data->>key', 'in', `(${planKeys.join(',')})`);
            for (const plan of plans || []) {
              const p = (plan.data || {}) as Record<string, unknown>;
              planLabels.set(String(p.key), String(p.label || String(p.key).replace(/_/g, ' ')));
            }
          }
          for (const profile of profiles || []) {
            try {
              if (profile.is_active === false || !profile.email) continue;
              const details = (profile.data || {}) as Record<string, unknown>;
              const endDate = String(details.plan_end_date || '').slice(0, 10);
              const planName = planLabels.get(String(details.plan || '')) || String(details.plan || 'Plano').replace(/_/g, ' ');
              const channels = notificationChannels(details.notification_delivery);
              if (channels.email) {
                await sendTemplateEmail('plan-expiring', profile.email, {
                  templateData: {
                    studentName: (profile.full_name || 'Aluna').trim().split(' ')[0],
                    planName,
                    validUntil: brDateLabel(endDate),
                  },
                  idempotencyKey: `plan-expiring-${profile.id}-${endDate}`,
                });
              }
              if (channels.app) {
                await supabaseAdmin.from('app_records').upsert({
                  id: `plan-expiring-${profile.id}-${endDate}`,
                  collection: 'Notification',
                  owner_id: profile.id,
                  data: {
                    user_email: profile.email, type: 'plan_expiring',
                    title: 'Seu plano está perto de vencer',
                    message: `Seu plano ${planName} vence em ${brDateLabel(endDate)}. Fale com a Raissa para renovar!`,
                    link: '/perfil', read: false,
                  },
                }, { onConflict: 'id', ignoreDuplicates: true });
              }
              summary.planExpiring += 1;
            } catch {
              summary.errors += 1;
            }
          }
        } catch {
          summary.errors += 1;
        }

        return Response.json({ ok: true, ...summary });
      },
    },
  },
});
