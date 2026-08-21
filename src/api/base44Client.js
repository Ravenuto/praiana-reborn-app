// Mock Base44 client — in-memory store so the UI works end-to-end without the real backend.
// All entities expose: list, filter, create, update, delete. Auth methods are no-ops that resolve.
// Replace with real backend later (Lovable Cloud / server functions).

const isBrowser = typeof window !== 'undefined';

const seedData = () => ({
  User: [
    {
      id: 'u-admin',
      full_name: 'Admin Raissa',
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
      author_name: 'Admin Raissa',
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

// E-mail único de administradora do estúdio.
export const ADMIN_EMAIL = 'ravenutto@gmail.com';

// Auth — uses localStorage to persist a fake session.
const AUTH_KEY = 'raissa_mock_auth_v1';
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

// Migração: garante que a conta de admin use o e-mail oficial e que alunas antigas fiquem ativas
store.User = (store.User || []).map((u) => {
  if (u.email === 'admin@raissapoledance.com' || u.role === 'admin' || u.is_admin) {
    return { ...u, email: ADMIN_EMAIL, role: 'admin', is_admin: true, is_active: true };
  }
  return u.is_active === undefined ? { ...u, is_active: true } : u;
});
persist();
const cachedSession = readAuth();
if (cachedSession && (cachedSession.role === 'admin' || cachedSession.is_admin)) {
  writeAuth({ ...cachedSession, email: ADMIN_EMAIL, is_active: true });
}

// Seed an admin session on first load so all screens are visible without manual login.
// Skip seeding if the user explicitly logged out.
if (isBrowser && !window.localStorage.getItem(AUTH_KEY) && !window.localStorage.getItem('raissa_logged_out')) {
  const admin = store.User.find((u) => u.email === ADMIN_EMAIL);
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
  async loginViaEmailPassword(a, b, c) {
    const args = pickArgs(a, b);
    const email = (args.email || '').trim().toLowerCase();
    const mode = args.mode || c || 'aluna';
    if (!email) throw new Error('Email obrigatório');

    // Garante que a conta da administradora exista e esteja correta
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

    if (mode === 'admin') {
      if (email !== ADMIN_EMAIL) {
        throw new Error('Este e-mail não tem acesso de administradora.');
      }
      writeAuth(adminUser);
      try { window.localStorage.removeItem('raissa_logged_out'); } catch { /* noop */ }
      return { user: adminUser, token: 'mock-token' };
    }

    // Modo aluna
    if (email === ADMIN_EMAIL) {
      writeAuth(adminUser);
      try { window.localStorage.removeItem('raissa_logged_out'); } catch { /* noop */ }
      return { user: adminUser, token: 'mock-token' };
    }

    let match = store.User.find((u) => (u.email || '').toLowerCase() === email);

    if (!match) {
      // Novo pedido de acesso: cria cadastro pendente e avisa a administradora
      match = {
        id: uid('user'),
        full_name: args.full_name || email.split('@')[0],
        email,
        role: 'user',
        is_admin: false,
        is_active: false,
        created_date: new Date().toISOString(),
      };
      store.User = [...store.User, match];
      store.Notification = [
        ...(store.Notification || []),
        {
          id: uid('notification'),
          created_date: new Date().toISOString(),
          user_email: ADMIN_EMAIL,
          type: 'access_request',
          title: 'Nova solicitação de acesso',
          message: `${match.full_name} (${email}) quer entrar no app. Aprove em Admin › Solicitações.`,
          link: '/admin',
          read: false,
          actor_name: match.full_name,
        },
      ];
      persist();
      const err = new Error('Cadastro enviado! Aguarde a aprovação da administradora para entrar.');
      err.code = 'pending_approval';
      throw err;
    }

    if (match.is_active !== true || match.plan === 'rejected') {
      const err = new Error(
        match.plan === 'rejected'
          ? 'Seu acesso foi recusado. Fale com o estúdio.'
          : 'Seu cadastro ainda está aguardando aprovação da administradora.'
      );
      err.code = 'pending_approval';
      throw err;
    }

    writeAuth(match);
    try { window.localStorage.removeItem('raissa_logged_out'); } catch { /* noop */ }
    return { user: match, token: 'mock-token' };
  },
  async register(a, b) {
    const { email, full_name } = pickArgs(a, b);
    if (!email) throw new Error('Email obrigatório');
    return auth.loginViaEmailPassword({ email, full_name, mode: 'aluna' });
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
