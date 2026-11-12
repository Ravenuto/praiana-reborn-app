import { format, parseISO, isValid } from "date-fns";

export const CLOSURE_TYPES = {
  holiday: { label: "Feriado", emoji: "🎉", message: "Não teremos aula hoje. Bom descanso 💙" },
  recess: { label: "Recesso", emoji: "☕", message: "Estamos em recesso. Bom descanso 💙" },
  vacation: { label: "Férias", emoji: "🏝️", message: "Estúdio em férias coletivas. Aproveite o descanso! 💙" },
};

export function closureType(record) {
  return CLOSURE_TYPES[record?.closure_type] || CLOSURE_TYPES.holiday;
}

export function closuresOnDate(records, date) {
  return records.filter(record => {
    const start = record.start_date || record.date;
    const end = record.end_date || start;
    return start && date >= start && date <= end;
  }).sort((a, b) => String(b.created_date || "").localeCompare(String(a.created_date || "")));
}

export function closurePayload({ type, start, end, message }) {
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || "") && isValid(parseISO(value)) && format(parseISO(value), "yyyy-MM-dd") === value;
  if (!CLOSURE_TYPES[type]) throw new Error("Selecione o tipo de fechamento.");
  if (!validDate(start) || !validDate(end)) throw new Error("Informe as datas de início e fim.");
  if (end < start) throw new Error("A data final não pode ser anterior à inicial.");
  return { date: start, start_date: start, end_date: end, closure_type: type, label: CLOSURE_TYPES[type].label, message: message.trim() || CLOSURE_TYPES[type].message };
}

// Reuse the existing Holiday collection; a period is one record, never a plan edit.
export async function saveClosure(entity, id, form) {
  const payload = closurePayload(form);
  return id ? entity.update(id, payload) : entity.create(payload);
}
