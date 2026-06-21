// Mock Base44 client — in-memory store so the UI works end-to-end without the real backend.
// All entities expose: list, filter, create, update, delete. Auth methods are no-ops that resolve.
// Replace with real backend later (Lovable Cloud / server functions).

const isBrowser = typeof window !== 'undefined';

const seedData = () => ({
  User: [
    {
      id: 'u-admin',
      full_name: 'Admin Raissa',
      email: 'admin@raissapoledance.com',
      role: 'admin',
      is_admin: true,
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
      author_name: 'Admin Praiana',
      content: 'Bem-vindas ao novo app da Praiana! 🌊 Reservem suas aulas pelo menu Aulas.',
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
});

const STORE_KEY = 'praiana_mock_store_v1';

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
};

// Auth — uses localStorage to persist a fake session.
const AUTH_KEY = 'praiana_mock_auth_v1';
const readAuth = () => {
  if (!isBrowser) return null;
  try { return JSON.parse(window.localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; }
};
const writeAuth = (u) => {
  if (!isBrowser) return;
  if (u) window.localStorage.setItem(AUTH_KEY, JSON.stringify(u));
  else window.localStorage.removeItem(AUTH_KEY);
};

// Normalize args: accept either (email, password) or ({ email, password, full_name })
const pickArgs = (a, b) => {
  if (a && typeof a === 'object') return a;
  return { email: a, password: b };
};

// Seed an admin session on first load so all screens are visible without manual login.
// Skip seeding if the user explicitly logged out.
if (isBrowser && !window.localStorage.getItem(AUTH_KEY) && !window.localStorage.getItem('praiana_logged_out')) {
  const admin = store.User.find((u) => u.email === 'admin@praiana.app');
  if (admin) writeAuth(admin);
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
  async loginViaEmailPassword(a, b) {
    const { email } = pickArgs(a, b);
    if (!email) throw new Error('Email obrigatório');
    const match = store.User.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    const user = match || store.User.find((u) => u.email === 'admin@praiana.app') || store.User[0];
    writeAuth(user);
    try { window.localStorage.removeItem('praiana_logged_out'); } catch {}
    return { user, token: 'mock-token' };
  },
  async register(a, b) {
    const { email, full_name } = pickArgs(a, b);
    if (!email) throw new Error('Email obrigatório');
    const admin = store.User.find((u) => u.email === 'admin@praiana.app');
    const user = admin ? { ...admin, full_name: full_name || admin.full_name } : store.User[0];
    writeAuth(user);
    return { user, token: 'mock-token' };
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
