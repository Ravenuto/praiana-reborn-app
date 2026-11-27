// Conta aulas dadas por professora: cada aula (horário + data) com pelo menos
// 1 aluna confirmada ou presente conta como 1 aula. Sem professora = dona do estúdio.
import { sessionForDate } from "./sessionHistory.js";

export const DEFAULT_RATE_CENTS = 1500;
export const DEFAULT_TEACHER_RATE_CENTS = 4000;

// Dona do estúdio: R$15; demais professoras: R$40, salvo valor cadastrado.
export function rateFor(teacherId, ownerId, rates) {
  const saved = rates.find((r) => r.student_id === teacherId)?.amount_cents;
  if (saved != null) return saved;
  return teacherId === ownerId ? DEFAULT_RATE_CENTS : DEFAULT_TEACHER_RATE_CENTS;
}
const COUNTED = new Set(["confirmada", "presente"]);

export function computeClassesTaught({ bookings, sessions, month, today, ownerName }) {
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const classes = new Map();
  for (const b of bookings) {
    const date = b.session_date || "";
    if (!date.startsWith(month) || date > today || !COUNTED.has(b.status)) continue;
    const key = `${b.session_id}|${date}`;
    if (!classes.has(key)) {
      const s = sessionForDate(sessionById.get(b.session_id) || {}, date);
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
