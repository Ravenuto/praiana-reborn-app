import { base44 } from "@/api/base44Client";

/**
 * When a booking is cancelled, promote the first person in the waitlist
 * for that session/date into a confirmed booking and notify them.
 * Returns the promoted entry, if any.
 */
export async function promoteFromWaitlist({ session_id, session_date, session_time, class_type_name }) {
  try {
    const entries = await base44.entities.WaitlistEntry.filter({ session_id, session_date });
    if (!entries.length) return null;
    const sorted = [...entries].sort((a, b) => (a.position || 0) - (b.position || 0));
    const next = sorted[0];

    // Create the confirmed booking
    await base44.entities.Booking.create({
      session_id,
      session_date,
      session_time: session_time || next.session_time,
      class_type_name: class_type_name || next.class_type_name,
      student_email: next.student_email,
      student_name: next.student_name,
      status: "confirmada",
    });

    // Try to deduct one credit from the promoted user
    try {
      const [u] = await base44.entities.User.filter({ email: next.student_email }, "-created_date", 1);
      if (u && u.role !== "admin") {
        const data = u.data || {};
        const credits = Math.max(0, (data.credits ?? u.credits ?? 0) - 1);
        const cleanData = Object.fromEntries(Object.entries(data).filter(([k]) => k !== "data"));
        await base44.entities.User.update(u.id, { data: { ...cleanData, credits } });
      }
    } catch { /* noop */ }

    // Notify the promoted student
    try {
      await base44.entities.Notification.create({
        user_email: next.student_email,
        type: "waitlist_promoted",
        title: "Vaga liberada! 🎉",
        message: `Você foi confirmada em ${class_type_name || next.class_type_name} no dia ${session_date} às ${session_time || next.session_time}.`,
        link: "/minhas-reservas",
        read: false,
      });
    } catch { /* noop */ }

    // Remove promoted entry and reindex remaining positions
    await base44.entities.WaitlistEntry.delete(next.id);
    const remaining = sorted.slice(1);
    for (let i = 0; i < remaining.length; i++) {
      const r = remaining[i];
      if ((r.position || 0) !== i + 1) {
        await base44.entities.WaitlistEntry.update(r.id, { position: i + 1 });
      }
    }
    return next;
  } catch {
    return null;
  }
}
