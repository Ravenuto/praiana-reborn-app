// Mock Base44 client — in-memory store so the UI works end-to-end without the real backend.
// All entities expose: list, filter, create, update, delete. Auth methods are no-ops that resolve.
// Replace with real backend later (Lovable Cloud / server functions).

const isBrowser = typeof window !== 'undefined';

const seedData = () => ({
  User: [
    {
      id: 'u-admin',
      full_name: 'Raissa Venuto',
      email: 'ravenutto@gmail.com',
      role: 'admin',
      is_admin: true,
      is_active: true,
      avatar_url: '',
      phone: '',
      active_plan_id: 'p-mensal',
      plan_status: 'active',
      credits_remaining: 12,
      plan_start_date: new Date(Date.now() - 7 * 86400000).toISOString(),
      plan_end_date: new Date(Date.now() + 23 * 86400000).toISOString(),
    },
    {
      id: 'u-aluna',
      full_name: 'Maria Raissa',
      email: 'maria@raissapoledance.com',
      role: 'user',
      is_admin: false,
      is_active: true,
      avatar_url: '',
      phone: '',
      active_plan_id: 'p-mensal',
      plan_status: 'active',
      credits_remaining: 6,
      plan_start_date: new Date(Date.now() - 4 * 86400000).toISOString(),
      plan_end_date: new Date(Date.now() + 26 * 86400000).toISOString(),
    },
  ],
  ClassType: [
    { id: 'ct-yoga', name: 'Yoga', color: '#266aae', duration_minutes: 60 },
    { id: 'ct-pilates', name: 'Pilates', color: '#F5A623', duration_minutes: 50 },
    { id: 'ct-surf', name: 'Surf Iniciante', color: '#5B8DB8', duration_minutes: 90 },
  ],
  ClassSession: Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() + Math.floor(i / 3));
    d.setHours(7 + (i % 3) * 3, 0, 0, 0);
    const types = ['ct-yoga', 'ct-pilates', 'ct-surf'];
    return {
      id: `cs-${i}`,
      class_type_id: types[i % 3],
      starts_at: d.toISOString(),
      duration_minutes: 60,
      capacity: 12,
      instructor: ['Ana', 'Bea', 'Carla'][i % 3],
      location: 'Praia Central',
      status: 'open',
    };
  }),
  Booking: [],
  StudioPlan: [
    { id: 'p-avulsa', name: 'Aula Avulsa', price: 80, credits: 1, duration_days: 30, description: 'Uma aula' },
    { id: 'p-mensal', name: 'Mensal 8x', price: 380, credits: 8, duration_days: 30, description: '8 aulas no mês' },
    { id: 'p-livre', name: 'Mensal Livre', price: 580, credits: 999, duration_days: 30, description: 'Aulas ilimitadas' },
  ],
  Post: [
    {
      id: 'post-1',
      author_id: 'u-admin',
      author_name: 'Raissa Venuto',
      content: 'Bem-vindas ao novo app do Studio Praiana Pole Dance! 🌊 Reservem suas aulas pelo menu Aulas.',
      created_date: new Date(Date.now() - 86400000).toISOString(),
      likes: ['u-aluna'],
      image_url: '',
    },
  ],
  Comment: [],
  Notice: [
    {
      id: 'n-1',
      title: 'Feriado segunda-feira',
      content: 'Não haverá aulas na próxima segunda. Bom feriado!',
      created_date: new Date().toISOString(),
      pinned: true,
    },
  ],
  Poll: [],
  Notification: [],
  PaymentHistory: [],
  Holiday: [],
  StudioSettings: [],
  StudentInvitation: [],
  WaitlistEntry: [],
  Move: [
    { id: 'mv-1', name: 'Fireman Spin', category: 'Giros', skill_level: 'pole_base', bilateral: true, notes: '', display_order: 0 },
    { id: 'mv-2', name: 'Chair Spin', category: 'Giros', skill_level: 'pole_base', bilateral: true, notes: '', display_order: 1 },
    { id: 'mv-3', name: 'Pole Sit', category: 'Figuras', skill_level: 'pole_base', bilateral: true, notes: '', display_order: 2 },
    { id: 'mv-4', name: 'Gancho de joelho', category: 'Figuras', skill_level: 'pole_base', bilateral: true, notes: '', display_order: 3 },
    { id: 'mv-5', name: 'Caminhada para o giro', category: 'Transições', skill_level: 'pole_base', bilateral: true, notes: '', display_order: 4 },
    { id: 'mv-6', name: 'Invertida básica', category: 'Figuras', skill_level: 'pole_intermediario', bilateral: true, notes: '', display_order: 5 },
    { id: 'mv-7', name: 'Carousel', category: 'Giratória', skill_level: 'pole_intermediario', bilateral: true, notes: '', display_order: 6 },
    { id: 'mv-8', name: 'Superman giratória', category: 'Giratória', skill_level: 'pole_avancado', bilateral: true, notes: '', display_order: 7 },
    { id: 'mv-9', name: 'Transição deitada para o chão', category: 'Transições', skill_level: 'pole_base', bilateral: false, notes: '', display_order: 8 },
  ],
  StudentMovePlan: [],
});

const STORE_KEY = 'raissa_mock_store_v1';

let store;
if (isBrowser) {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    store = raw ? JSON.parse(raw) : seedData();
  } catch {
    store = seedData();
  }
} else {
  store = seedData();
}

// Garante que coleções novas (adicionadas em versões posteriores) existam em stores antigos
const defaults = seedData();
Object.keys(defaults).forEach((k) => {
  if (!Array.isArray(store[k])) store[k] = defaults[k];
});

const persist = () => {
  if (!isBrowser) return;
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* noop */ }
};

const uid = (prefix = 'id') => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const matchFilter = (row, filter) => {
  return Object.entries(filter || {}).every(([k, v]) => {
    if (Array.isArray(v)) return v.includes(row[k]);
    return row[k] === v;
  });
};

const applySortLimit = (rows, sort, limit) => {
  let out = rows;
  if (typeof sort === "string" && sort) {
    const desc = sort.startsWith("-");
    const key = desc ? sort.slice(1) : sort;
    out = [...out].sort((a, b) => {
      const av = a?.[key], bv = b?.[key];
      if (av === bv) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return desc ? (av < bv ? 1 : -1) : (av < bv ? -1 : 1);
    });
  }
  if (typeof limit === "number" && limit > 0) out = out.slice(0, limit);
  return out;
};

const makeEntity = (name) => ({
  async list(sort, limit) {
    const rows = [...(store[name] || [])];
    return applySortLimit(rows, sort, limit);
  },
  async filter(filter, sort, limit) {
    const rows = (store[name] || []).filter((r) => matchFilter(r, filter));
    return applySortLimit(rows, sort, limit);
  },
  async get(id) {
    return (store[name] || []).find((r) => r.id === id) || null;
  },
  async create(data) {
    const row = { id: uid(name.toLowerCase()), created_date: new Date().toISOString(), ...data };
    store[name] = [...(store[name] || []), row];
    persist();
    return row;
  },
  async update(id, data) {
    store[name] = (store[name] || []).map((r) => (r.id === id ? { ...r, ...data } : r));
    persist();
    return store[name].find((r) => r.id === id);
  },
  async delete(id) {
    store[name] = (store[name] || []).filter((r) => r.id !== id);
    persist();
    return { id };
  },
});

const entities = {
  User: makeEntity('User'),
  ClassType: makeEntity('ClassType'),
  ClassSession: makeEntity('ClassSession'),
  Booking: makeEntity('Booking'),
  StudioPlan: makeEntity('StudioPlan'),
  Post: makeEntity('Post'),
  Comment: makeEntity('Comment'),
  Notice: makeEntity('Notice'),
  Poll: makeEntity('Poll'),
  Notification: makeEntity('Notification'),
  PaymentHistory: makeEntity('PaymentHistory'),
  Holiday: makeEntity('Holiday'),
  StudioSettings: makeEntity('StudioSettings'),
  StudentInvitation: makeEntity('StudentInvitation'),
  WaitlistEntry: makeEntity('WaitlistEntry'),
  Move: makeEntity('Move'),
  StudentMovePlan: makeEntity('StudentMovePlan'),
};

// Senha padrão do primeiro acesso (editável em Regras do estúdio).
export const FALLBACK_DEFAULT_PASSWORD = 'praiana';
export const getDefaultPassword = () => {
  const row = (store.StudioSettings || []).find((r) => r.key === 'default_password');
  return (row && row.value) || FALLBACK_DEFAULT_PASSWORD;
};

// E-mail único de administradora do estúdio.
export const ADMIN_EMAIL = 'ravenutto@gmail.com';

// Auth — sessão local. "Manter conectado" grava em localStorage; senão, sessionStorage.
const AUTH_KEY = 'raissa_mock_auth_v2';
const LEGACY_AUTH_KEYS = ['raissa_mock_auth_v1'];
const readAuth = () => {
  if (!isBrowser) return null;
  try {
    const raw =
      window.sessionStorage.getItem(AUTH_KEY) || window.localStorage.getItem(AUTH_KEY) || 'null';
    return JSON.parse(raw);
  } catch { return null; }
};
const writeAuth = (u, remember) => {
  if (!isBrowser) return;
  try {
    if (!u) {
      window.localStorage.removeItem(AUTH_KEY);
      window.sessionStorage.removeItem(AUTH_KEY);
      return;
    }
    const value = JSON.stringify(u);
    // Mantém a sessão onde ela já está, a menos que o login diga o contrário.
    const persistent =
      remember === undefined
        ? window.localStorage.getItem(AUTH_KEY) !== null
        : Boolean(remember);
    if (persistent) {
      window.localStorage.setItem(AUTH_KEY, value);
      window.sessionStorage.removeItem(AUTH_KEY);
    } else {
      window.sessionStorage.setItem(AUTH_KEY, value);
      window.localStorage.removeItem(AUTH_KEY);
    }
  } catch { /* noop */ }
};

// Limpa sessões antigas criadas automaticamente (nunca houve login de verdade nelas).
if (isBrowser) {
  try { LEGACY_AUTH_KEYS.forEach((k) => window.localStorage.removeItem(k)); } catch { /* noop */ }
}

// Normalize args: accept either (email, password) or ({ email, password, full_name })
const pickArgs = (a, b) => {
  if (a && typeof a === 'object') return a;
  return { email: a, password: b };
};

// Migração: garante que a conta de admin use o e-mail oficial e que alunas antigas fiquem ativas
store.User = (store.User || []).map((u) => {
  let next = u;
  if (u.email === 'admin@raissapoledance.com') {
    next = { ...next, email: ADMIN_EMAIL, role: 'admin', is_admin: true, is_active: true };
  }
  if ((next.full_name || '').trim().toLowerCase() === 'admin raissa') {
    next = { ...next, full_name: 'Raissa Venuto' };
  }
  if (next.is_active === undefined) next = { ...next, is_active: true };
  return next;
});
persist();
const cachedSession = readAuth();
if (cachedSession) {
  const freshCached = store.User.find((u) => u.id === cachedSession.id);
  if (freshCached) writeAuth(freshCached);
}


const auth = {
  async me() {
    const cached = readAuth();
    if (!cached) {
      const err = new Error('not authenticated');
      err.status = 401;
      throw err;
    }
    const fresh = store.User.find((u) => u.id === cached.id);
    return fresh || cached;
  },
  async loginViaEmailPassword(a, b, c) {
    const args = pickArgs(a, b);
    const email = (args.email || '').trim().toLowerCase();
    const password = args.password ?? b ?? '';
    const mode = args.mode || c || 'aluna';
    if (!email) throw new Error('Email obrigatório');

    // Garante que a conta da administradora principal exista
    let adminUser = store.User.find((u) => (u.email || '').toLowerCase() === ADMIN_EMAIL);
    if (!adminUser) {
      adminUser = {
        id: uid('user'),
        full_name: 'Raissa Venuto',
        email: ADMIN_EMAIL,
        role: 'admin',
        is_admin: true,
        is_active: true,
      };
      store.User = [...store.User, adminUser];
      persist();
    }

    const match = store.User.find((u) => (u.email || '').toLowerCase() === email);
    if (!match) {
      const err = new Error('Este e-mail não está cadastrado. Fale com o estúdio.');
      err.code = 'not_registered';
      throw err;
    }

    const isAdminAccount = match.role === 'admin' || match.is_admin === true;
    const isTeacherAccount = match.role === 'teacher' || match.is_teacher === true;
    if (mode === 'admin' && !isAdminAccount) {
      throw new Error('Este e-mail não tem acesso de administrador.');
    }
    if (mode === 'professor' && !isTeacherAccount && !isAdminAccount) {
      throw new Error('Este e-mail não tem acesso de professora.');
    }

    // Senha: se a conta ainda não trocou a senha, aceita a senha padrão do estúdio
    const stored = match.password;
    const usingDefault = !stored;
    const expected = usingDefault ? getDefaultPassword() : stored;
    if (String(password || '') !== String(expected)) {
      throw new Error('Email ou senha inválidos');
    }

    if (usingDefault && match.must_change_password !== true) {
      store.User = store.User.map((u) => (u.id === match.id ? { ...u, must_change_password: true } : u));
      persist();
    }

    const fresh = store.User.find((u) => u.id === match.id);
    writeAuth(fresh);
    try { window.localStorage.removeItem('raissa_logged_out'); } catch { /* noop */ }
    try { window.localStorage.setItem('raissa_login_mode', mode); } catch { /* noop */ }
    return { user: fresh, token: 'mock-token', mustChangePassword: usingDefault, isAdmin: isAdminAccount, isTeacher: isTeacherAccount, mode };
  },
  async changePassword(newPassword) {
    const cached = readAuth();
    if (!cached) throw new Error('not authenticated');
    if (!newPassword || String(newPassword).length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres');
    }
    store.User = store.User.map((u) =>
      u.id === cached.id ? { ...u, password: String(newPassword), must_change_password: false } : u
    );
    persist();
    const updated = store.User.find((u) => u.id === cached.id);
    writeAuth(updated);
    return updated;
  },
  async resetToDefaultPassword(userId) {
    store.User = store.User.map((u) =>
      u.id === userId ? { ...u, password: undefined, must_change_password: true } : u
    );
    persist();
    return { ok: true, password: getDefaultPassword() };
  },
  async register() {
    const err = new Error('O cadastro é feito pelo estúdio. Fale com a administradora.');
    err.code = 'not_registered';
    throw err;
  },
  async updateMe(data) {
    const cached = readAuth();
    if (!cached) throw new Error('not authenticated');
    store.User = store.User.map((u) => (u.id === cached.id ? { ...u, ...data } : u));
    persist();
    const updated = store.User.find((u) => u.id === cached.id);
    writeAuth(updated);
    return updated;
  },
  async logout() { writeAuth(null); },
  async resetPasswordRequest() { return { ok: true }; },
  async resetPassword() { return { ok: true }; },
  async resendOtp() { return { ok: true }; },
  async verifyOtp() { return { ok: true }; },
  setToken() {},
  redirectToLogin() { if (isBrowser) window.location.assign('/login'); },
};

const integrations = {
  Core: {
    async UploadFile({ file }) {
      if (!isBrowser) return { file_url: '' };
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ file_url: reader.result });
        reader.readAsDataURL(file);
      });
    },
  },
};

const functions = {
  async invoke() { return { ok: true }; },
};

export const base44 = { entities, auth, integrations, functions };
