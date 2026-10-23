// Date/clock helpers for scheduled email jobs, shared with tests.
// All student-facing times use America/Bahia (studio local time).
export function todayInBahia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bahia' }).format(now); // YYYY-MM-DD
}

export function bahiaClock(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Bahia', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(now); // HH:MM
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + days)).toISOString().slice(0, 10);
}

export function brDateLabel(iso: unknown): string {
  const s = String(iso || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split('-').reverse().join('/') : '';
}

// Zero-padded HH:MM strings compare correctly as plain strings.
export function timeHasPassed(classTime: unknown, nowClock: string): boolean {
  const t = String(classTime || '').slice(0, 5);
  return /^\d{2}:\d{2}$/.test(t) ? t <= nowClock : true;
}
