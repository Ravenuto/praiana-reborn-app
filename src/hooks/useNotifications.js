import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { getAdminNotifPrefs } from "@/lib/adminNotifPrefs";

export function useUnreadCount(userEmail) {
  const { data = [] } = useQuery({
    queryKey: ["notifCount", userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail, read: false }, "-created_date", 50),
    enabled: !!userEmail,
    refetchInterval: 30000, // atualiza a cada 30s
  });
  return data.length;
}

export async function createNotification({ user_email, type, title, message, link, actor_name }) {
  // Respeita as preferências de notificação da administração
  try {
    const users = await base44.entities.User.filter({ email: user_email });
    const target = users?.[0];
    if (target && (target.is_admin || target.role === "admin")) {
      const prefs = await getAdminNotifPrefs();
      // Só aplica filtro para os tipos configuráveis no admin
      const configurable = ADMIN_NOTIF_TYPES.map((t) => t.type);
      if (configurable.includes(type) && prefs[type] === false) return;
    }
  } catch { /* noop */ }
  await base44.entities.Notification.create({ user_email, type, title, message, link, actor_name, read: false });
}

// Cria notificações em lote para várias alunas (filtra inativas e admins).
export async function notifyAllStudents({ type, title, message, link, actor_name }) {
  try {
    const users = await base44.entities.User.list();
    const targets = (users || []).filter((u) => {
      if (!u?.email) return false;
      if (u.is_admin || u.role === "admin") return false;
      const active = u.data?.is_active ?? u.is_active ?? true;
      return active !== false && !u.is_invited;
    });
    await Promise.all(
      targets.map((u) =>
        base44.entities.Notification.create({
          user_email: u.email, type, title, message, link, actor_name, read: false,
        })
      )
    );
  } catch { /* noop */ }
}

// Notifica apenas as alunas que tinham reserva numa sessão/data específica.
export async function notifyBookedStudents({ session_id, date, type, title, message, link, actor_name }) {
  try {
    const filter = { session_id };
    if (date) filter.date = date;
    const bookings = await base44.entities.Booking.filter(filter);
    const emails = [...new Set((bookings || []).map((b) => b.student_email).filter(Boolean))];
    await Promise.all(
      emails.map((email) =>
        base44.entities.Notification.create({
          user_email: email, type, title, message, link, actor_name, read: false,
        })
      )
    );
  } catch { /* noop */ }
}