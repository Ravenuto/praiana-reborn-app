// Duração dos planos do estúdio (em dias) + rótulos amigáveis.

export const DURATION_PRESETS = [
  { value: 30, label: "Mensal", short: "mensal" },
  { value: 90, label: "Trimestral", short: "trimestral" },
  { value: 180, label: "Semestral", short: "semestral" },
  { value: 365, label: "Anual", short: "anual" },
];

export const DEFAULT_DURATION_DAYS = 30;

export function getDurationDays(plan) {
  const d = Number(plan?.duration_days);
  return Number.isFinite(d) && d > 0 ? d : DEFAULT_DURATION_DAYS;
}

// "Trimestral" / "45 dias"
export function durationLabel(days) {
  const preset = DURATION_PRESETS.find((p) => p.value === Number(days));
  if (preset) return preset.label;
  const n = Number(days) || DEFAULT_DURATION_DAYS;
  return `${n} dias`;
}

// "trimestral" / "45 dias" (minúsculo, para usar depois do preço)
export function durationShort(days) {
  const preset = DURATION_PRESETS.find((p) => p.value === Number(days));
  if (preset) return preset.short;
  const n = Number(days) || DEFAULT_DURATION_DAYS;
  return `${n} dias`;
}

// Soma dias a uma data (string YYYY-MM-DD ou Date) e devolve YYYY-MM-DD
export function addDaysISO(start, days) {
  const base = start ? new Date(`${String(start).slice(0, 10)}T12:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return "";
  base.setDate(base.getDate() + (Number(days) || 0));
  return base.toISOString().slice(0, 10);
}

// Dias restantes até a data de validade (pode ser negativo)
export function daysLeft(endDate) {
  if (!endDate) return null;
  const end = new Date(`${String(endDate).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((end - today) / 86400000);
}

// ---- Parcelamento ----

// Nº de parcelas sugerido pela duração (30 dias = 1x, 90 = 3x, 180 = 6x, 365 = 12x)
export function installmentsFromDays(days) {
  const d = Number(days) || DEFAULT_DURATION_DAYS;
  return Math.max(1, Math.round(d / 30));
}

export function formatBRL(value) {
  const n = Number(value) || 0;
  return `R$ ${n.toFixed(2).replace(".", ",").replace(/,00$/, "")}`;
}

// Nº de parcelas do plano (respeita installments salvo, senão deriva da duração)
export function getInstallments(plan) {
  const n = Number(plan?.installments);
  if (Number.isFinite(n) && n > 0) return n;
  return installmentsFromDays(getDurationDays(plan));
}

// Texto principal do preço: "6x de R$ 300" ou "R$ 250"
export function priceMain(priceValue, installments) {
  const n = Math.max(1, Number(installments) || 1);
  const total = Number(priceValue) || 0;
  if (n <= 1) return formatBRL(total);
  return `${n}x de ${formatBRL(total / n)}`;
}

// Texto secundário: "Total R$ 1.800" (vazio quando à vista)
export function priceTotalLabel(priceValue, installments) {
  const n = Math.max(1, Number(installments) || 1);
  if (n <= 1) return "";
  return `Total ${formatBRL(priceValue)}`;
}

// "R$ 62,50/aula" considerando todas as aulas do período
export function perClassLabel(priceValue, credits) {
  const c = Number(credits) || 1;
  const total = Number(priceValue) || 0;
  if (c <= 1) return "por aula";
  return `${formatBRL(total / c)}/aula`;
}
