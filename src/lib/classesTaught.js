// Conta aulas dadas por professora: cada aula (horário + data) com pelo menos
// 1 aluna confirmada ou presente conta como 1 aula. Sem professora = dona do estúdio.
export const DEFAULT_RATE_CENTS = 1500;
const COUNTED = new Set(["confirmada", "presente"]);

export function computeClassesTaught({ bookings, sessions, month, today, ownerName }) {
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const classes = new Map();
  for (const b of bookings) {
    const date = b.session_date || "";
    if (!date.startsWith(month) || date > today || !COUNTED.has(b.status)) continue;
    const key = `${b.session_id}|${date}`;
    if (!classes.has(key)) {
      const s = sessionById.get(b.session_id) || {};
      classes.set(key, {
        key, date,
        time: s.time || b.session_time || "",
        name: s.class_type_name || b.class_type_name || "Aula",
        teacher: (s.instructor || "").trim() || ownerName,
        students: [],
      });
    }
    classes.get(key).students.push(b.student_name || b.guest_name || "Aluna");
  }
  const byTeacher = {};
  for (const c of classes.values()) (byTeacher[c.teacher] ||= []).push(c);
  for (const list of Object.values(byTeacher)) list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return byTeacher;
}
