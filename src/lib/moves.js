// Movimentos do mês — constantes e helpers compartilhados

export const MOVE_CATEGORIES = [
  "Figuras",
  "Giros",
  "Giratória",
  "Transições",
];

// Níveis da biblioteca (dificuldade do movimento)
export const SKILL_LEVELS = [
  { key: "pole_base", label: "Pole Base", short: "Base", badge: "bg-primary/12 text-primary" },
  { key: "pole_intermediario", label: "Pole Intermediário", short: "Intermediário", badge: "bg-accent/20 text-accent-foreground" },
  { key: "pole_avancado", label: "Pole Avançado", short: "Avançado", badge: "bg-destructive/12 text-destructive" },
];

export const skillInfo = (key) =>
  SKILL_LEVELS.find((l) => l.key === key) || SKILL_LEVELS[0];

// Níveis de progresso da aluna em cada movimento
export const LEVELS = [
  { key: "a_treinar", label: "A treinar", short: "A treinar", badge: "bg-muted text-muted-foreground" },
  { key: "em_progresso", label: "Em progresso", short: "Progresso", badge: "bg-accent/20 text-accent-foreground" },
  { key: "dominado", label: "Dominado", short: "Dominado", badge: "bg-primary/15 text-primary" },
];

export const levelInfo = (key) => LEVELS.find((l) => l.key === key) || LEVELS[0];

export const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const prevMonth = (month) => {
  const [y, m] = (month || currentMonth()).split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const monthLabel = (month) => {
  if (!month) return "";
  const [y, m] = month.split("-").map(Number);
  return `${MONTH_NAMES[(m || 1) - 1]} de ${y}`;
};

// Últimos N meses (mais recente primeiro), incluindo o mês atual
export const recentMonths = (n = 12) => {
  const out = [];
  let m = currentMonth();
  for (let i = 0; i < n; i++) {
    out.push(m);
    m = prevMonth(m);
  }
  return out;
};

// Progresso: quantos "lados" já estão dominados
export const planProgress = (items = []) => {
  let total = 0;
  let done = 0;
  items.forEach((it) => {
    if (it.bilateral === false) {
      total += 1;
      if (it.left_level === "dominado") done += 1;
    } else {
      total += 2;
      if (it.left_level === "dominado") done += 1;
      if (it.right_level === "dominado") done += 1;
    }
  });
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
};
