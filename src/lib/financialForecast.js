import { getInstallments } from "@/lib/planDuration";

export const monthKey = (value) => String(value || "").slice(0, 7);
export const monthDate = (value) => `${monthKey(value)}-01`;

export function addMonths(month, count) {
  const [year, number] = monthKey(month).split("-").map(Number);
  if (!year || !number) return "";
  const date = new Date(Date.UTC(year, number - 1 + count, 1));
  return date.toISOString().slice(0, 7);
}

export function money(cents) {
  return (Number(cents) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function forecastForMonth(students, plans, entries, month) {
  const planByKey = new Map(plans.map((plan) => [plan.key, plan]));
  const rows = [];
  for (const student of students) {
    if (student.role === "admin" || student.role === "teacher" || student.is_teacher) continue;
    const plan = planByKey.get(student.plan);
    if (!plan) continue;
    const start = monthKey(student.plan_start_date || student.created_date);
    if (!start || month < start) continue;
    const installments = getInstallments(plan);
    if (installments === 1) {
      if (student.is_active === false) continue;
      const override = entries.find((entry) => entry.student_id === student.id && entry.kind === "monthly_override" && monthKey(entry.month) === month);
      rows.push({ student, plan, kind: "monthly", cents: override?.amount_cents ?? Math.round(Number(plan.price_value || 0) * 100), override });
      continue;
    }
    const allocation = entries.find((entry) => entry.student_id === student.id && entry.kind === "allocation" && monthKey(entry.month) === start && entry.plan_key === plan.key);
    const offset = (Number(month.slice(0, 4)) - Number(start.slice(0, 4))) * 12 + Number(month.slice(5, 7)) - Number(start.slice(5, 7));
    if (offset < 0 || offset >= (allocation?.installments || installments)) continue;
    const count = allocation?.installments || installments;
    const total = allocation?.amount_cents ?? Math.round(Number(plan.price_value || 0) * 100);
    const base = Math.floor(total / count);
    rows.push({ student, plan, kind: "allocation", cents: base + (offset === count - 1 ? total - base * count : 0), total, count, offset, allocation, start });
  }
  return rows.sort((a, b) => (a.student.full_name || a.student.email || "").localeCompare(b.student.full_name || b.student.email || "", "pt-BR"));
}