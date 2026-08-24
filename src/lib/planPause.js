// Pausa temporária do plano da aluna.
// Campos guardados em user.data: plan_paused, plan_paused_at (YYYY-MM-DD), plan_paused_days.

const todayISO = () => new Date().toISOString().slice(0, 10);

export function normalizeUser(u) {
  return { ...(u || {}), ...((u && u.data) || {}) };
}

export function isPlanPaused(u) {
  return normalizeUser(u).plan_paused === true;
}

export function pausedSince(u) {
  return normalizeUser(u).plan_paused_at || null;
}

// Dias completos entre a data de início da pausa e hoje (mínimo 0).
export function pausedDays(startISO) {
  if (!startISO) return 0;
  const start = new Date(`${String(startISO).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(start.getTime())) return 0;
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return Math.max(0, Math.round((now - start) / 86400000));
}

// Dias completos entre duas datas (mínimo 0).
export function daysBetweenISO(aISO, bISO) {
  if (!aISO || !bISO) return 0;
  const a = new Date(`${String(aISO).slice(0, 10)}T12:00:00`);
  const b = new Date(`${String(bISO).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
}

export const pauseToday = todayISO;
