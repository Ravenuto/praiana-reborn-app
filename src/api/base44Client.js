// Backend real (Lovable Cloud). Mantém a mesma API usada pelo app:
// base44.entities.<Nome>.{list,filter,get,create,update,delete} e base44.auth.*
import { supabase } from '@/integrations/supabase/client';
import {
  adminCreateUser,
  adminDeleteUser,
  adminSetPassword,
  adminSetRoles,
  bootstrapAdmin,
} from '@/lib/adminUsers.functions';

const isBrowser = typeof window !== 'undefined';

export const ADMIN_EMAIL = 'ravenutto@gmail.com';
export const FALLBACK_DEFAULT_PASSWORD = 'praiana';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const matchFilter = (row, filter) =>
  Object.entries(filter || {}).every(([k, v]) => {
    if (Array.isArray(v)) return v.includes(row[k]);
    if (typeof v === 'string' && typeof row[k] === 'string' && k === 'email') {
      return row[k].toLowerCase() === v.toLowerCase();
    }
    return row[k] === v;
  });

const applySortLimit = (rows, sort, limit) => {
  let out = rows;
  if (typeof sort === 'string' && sort) {
    const desc = sort.startsWith('-');
    const key = desc ? sort.slice(1) : sort;
    out = [...out].sort((a, b) => {
      const av = a?.[key];
      const bv = b?.[key];
      if (av === bv) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return desc ? (av < bv ? 1 : -1) : av < bv ? -1 : 1;
    });
  }
  if (typeof limit === 'number' && limit > 0) out = out.slice(0, limit);
  return out;
};

const throwIf = (error) => {
  if (error) throw new Error(error.message || 'Erro no servidor');
};

const currentUserId = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
};

/* ------------------------------------------------------------------ */
/* Coleções genéricas (aulas, reservas, planos, avisos, etc.)          */
/* ------------------------------------------------------------------ */

const fromRecord = (row) => ({
  ...(row.data || {}),
  id: row.id,
  created_date: row.created_date,
});

const makeEntity = (collection) => ({
  async list(sort, limit) {
    const { data, error } = await supabase
      .from('app_records')
      .select('*')
      .eq('collection', collection);
    throwIf(error);
    return applySortLimit((data || []).map(fromRecord), sort, limit);
  },
  async filter(filter, sort, limit) {
    const rows = await this.list();
    return applySortLimit(rows.filter((r) => matchFilter(r, filter)), sort, limit);
  },
  async get(id) {
    const { data, error } = await supabase
      .from('app_records')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    throwIf(error);
    return data ? fromRecord(data) : null;
  },
  async create(payload) {
    const { id: _ignored, created_date, ...rest } = payload || {};
    const owner = await currentUserId();
    const { data, error } = await supabase
      .from('app_records')
      .insert({
        collection,
        owner_id: owner,
        data: rest,
        ...(created_date ? { created_date } : {}),
      })
      .select()
      .single();
    throwIf(error);
    return fromRecord(data);
  },
  async update(id, patch) {
    const { data: current, error: readError } = await supabase
      .from('app_records')
      .select('data')
      .eq('id', id)
      .maybeSingle();
    throwIf(readError);
    const { id: _i, created_date: _c, ...rest } = patch || {};
    const { data, error } = await supabase
      .from('app_records')
      .update({ data: { ...(current?.data || {}), ...rest } })
      .eq('id', id)
      .select()
      .single();
    throwIf(error);
    return fromRecord(data);
  },
  async delete(id) {
    const { error } = await supabase.from('app_records').delete().eq('id', id);
    throwIf(error);
    return { id };
  },
});

/* ------------------------------------------------------------------ */
/* Usuários (perfis + papéis)                                          */
/* ------------------------------------------------------------------ */

const PROFILE_COLUMNS = [
  'email',
  'full_name',
  'phone',
  'avatar_url',
  'is_active',
  'must_change_password',
  'active_plan_id',
  'plan_status',
  'credits_remaining',
  'plan_start_date',
  'plan_end_date',
];

const rolesOf = (roleRows, userId) =>
  (roleRows || []).filter((r) => r.user_id === userId).map((r) => r.role);

const fromProfile = (row, roleRows) => {
  const roles = rolesOf(roleRows, row.id);
  const isAdmin = roles.includes('admin');
  const isTeacher = roles.includes('teacher');
  return {
    ...(row.data || {}),
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone,
    avatar_url: row.avatar_url,
    is_active: row.is_active,
    must_change_password: row.must_change_password,
    active_plan_id: row.active_plan_id,
    plan_status: row.plan_status,
    credits_remaining: row.credits_remaining,
    plan_start_date: row.plan_start_date,
    plan_end_date: row.plan_end_date,
    data: row.data || {},
    created_date: row.created_at,
    role: isAdmin ? 'admin' : isTeacher ? 'teacher' : 'user',
    is_admin: isAdmin,
    is_teacher: isTeacher,
  };
};

const rolesFromPatch = (patch, fallback) => {
  const roles = [];
  if (patch.role === 'admin' || patch.is_admin === true) roles.push('admin');
  if (patch.role === 'teacher' || patch.is_teacher === true) roles.push('teacher');
  if (!roles.length) roles.push('student');
  if (patch.role === undefined && patch.is_admin === undefined && patch.is_teacher === undefined) {
    return fallback;
  }
  return roles;
};

const splitProfilePatch = (patch, currentData) => {
  const columns = {};
  const extra = { ...(currentData || {}) };
  Object.entries(patch || {}).forEach(([k, v]) => {
    if (['id', 'role', 'is_admin', 'is_teacher', 'password', 'created_date'].includes(k)) return;
    if (k === 'data') {
      Object.assign(extra, v || {});
      return;
    }
    if (PROFILE_COLUMNS.includes(k)) columns[k] = v;
    else extra[k] = v;
  });
  if (columns.email) columns.email = String(columns.email).trim().toLowerCase();
  return { columns, extra };
};

const loadUsers = async () => {
  const [{ data: profiles, error: pErr }, { data: roleRows, error: rErr }] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('user_roles').select('user_id, role'),
  ]);
  throwIf(pErr);
  throwIf(rErr);
  return (profiles || []).map((p) => fromProfile(p, roleRows));
};

const userEntity = {
  async list(sort, limit) {
    return applySortLimit(await loadUsers(), sort, limit);
  },
  async filter(filter, sort, limit) {
    const rows = await loadUsers();
    return applySortLimit(rows.filter((r) => matchFilter(r, filter)), sort, limit);
  },
  async get(id) {
    const rows = await loadUsers();
    return rows.find((r) => r.id === id) || null;
  },
  async create(payload) {
    const { columns, extra } = splitProfilePatch(payload, {});
    const roles = rolesFromPatch(payload, ['student']);
    const res = await adminCreateUser({
      data: {
        email: String(payload.email || '').trim().toLowerCase(),
        password: getDefaultPassword(),
        roles,
        profile: { ...columns, must_change_password: true, data: extra },
      },
    });
    return (await userEntity.get(res.id)) || { id: res.id, ...payload };
  },
  async update(id, patch) {
    const { data: current, error } = await supabase
      .from('profiles')
      .select('data')
      .eq('id', id)
      .maybeSingle();
    throwIf(error);
    const { columns, extra } = splitProfilePatch(patch, current?.data || {});
    const { error: upErr } = await supabase
      .from('profiles')
      .update({ ...columns, data: extra })
      .eq('id', id);
    throwIf(upErr);

    const roles = rolesFromPatch(patch, null);
    if (roles) await adminSetRoles({ data: { userId: id, roles } });
    return userEntity.get(id);
  },
  async delete(id) {
    await adminDeleteUser({ data: { userId: id } });
    return { id };
  },
};

const entities = {
  User: userEntity,
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

/* ------------------------------------------------------------------ */
/* Senha padrão do primeiro acesso                                     */
/* ------------------------------------------------------------------ */

let defaultPasswordCache = FALLBACK_DEFAULT_PASSWORD;

const refreshDefaultPassword = async () => {
  try {
    const rows = await entities.StudioSettings.filter({ key: 'default_password' });
    if (rows[0]?.value) defaultPasswordCache = String(rows[0].value);
  } catch {
    /* mantém o padrão */
  }
};

export const getDefaultPassword = () => defaultPasswordCache || FALLBACK_DEFAULT_PASSWORD;

/* ------------------------------------------------------------------ */
/* Autenticação                                                        */
/* ------------------------------------------------------------------ */

const REMEMBER_KEY = 'raissa_remember';
const SESSION_MARK = 'raissa_session_active';

// Sem "manter conectado", a sessão termina quando o navegador é fechado.
const enforceSessionOnly = async () => {
  if (!isBrowser) return;
  try {
    const remember = window.localStorage.getItem(REMEMBER_KEY);
    const active = window.sessionStorage.getItem(SESSION_MARK);
    if (remember === '0' && !active) {
      window.localStorage.removeItem(REMEMBER_KEY);
      await supabase.auth.signOut();
    }
  } catch {
    /* noop */
  }
};

const sessionOnlyReady = enforceSessionOnly();

const loadMe = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    const err = new Error('not authenticated');
    err.status = 401;
    throw err;
  }
  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle(),
    supabase.from('user_roles').select('user_id, role').eq('user_id', data.user.id),
  ]);
  if (!profile) {
    return {
      id: data.user.id,
      email: data.user.email,
      full_name: '',
      role: 'user',
      is_active: true,
      data: {},
    };
  }
  return fromProfile(profile, roleRows);
};

const auth = {
  async me() {
    await sessionOnlyReady;
    const me = await loadMe();
    refreshDefaultPassword();
    return me;
  },

  async loginViaEmailPassword(a, b, c) {
    const args = a && typeof a === 'object' ? a : { email: a, password: b };
    const email = (args.email || '').trim().toLowerCase();
    const password = String(args.password ?? b ?? '');
    const mode = args.mode || c || 'aluna';
    const remember = Boolean(args.remember);
    if (!email) throw new Error('Email obrigatório');

    let { error } = await supabase.auth.signInWithPassword({ email, password });

    // Primeiro acesso do estúdio: cria a conta da administradora principal.
    if (error && email === ADMIN_EMAIL) {
      try {
        const res = await bootstrapAdmin({ data: { email, password } });
        if (res?.created) {
          ({ error } = await supabase.auth.signInWithPassword({ email, password }));
        }
      } catch {
        /* mantém o erro original */
      }
    }

    if (error) {
      const err = new Error('Email ou senha inválidos');
      err.code = 'invalid_credentials';
      throw err;
    }

    const me = await loadMe();
    const isAdminAccount = me.is_admin === true;
    const isTeacherAccount = me.is_teacher === true;
    if (mode === 'admin' && !isAdminAccount) {
      await supabase.auth.signOut();
      throw new Error('Este e-mail não tem acesso de administrador.');
    }
    if (mode === 'professor' && !isTeacherAccount && !isAdminAccount) {
      await supabase.auth.signOut();
      throw new Error('Este e-mail não tem acesso de professora.');
    }

    if (isBrowser) {
      try {
        window.localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
        window.sessionStorage.setItem(SESSION_MARK, '1');
        window.localStorage.removeItem('raissa_logged_out');
        window.localStorage.setItem('raissa_login_mode', mode);
      } catch {
        /* noop */
      }
    }

    return {
      user: me,
      token: 'supabase',
      mustChangePassword: me.must_change_password === true,
      isAdmin: isAdminAccount,
      isTeacher: isTeacherAccount,
      mode,
    };
  },

  async changePassword(newPassword) {
    if (!newPassword || String(newPassword).length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres');
    }
    const { error } = await supabase.auth.updateUser({ password: String(newPassword) });
    if (error) throw new Error(error.message);
    const id = await currentUserId();
    if (id) await supabase.from('profiles').update({ must_change_password: false }).eq('id', id);
    return loadMe();
  },

  async resetToDefaultPassword(userId) {
    const password = getDefaultPassword();
    await adminSetPassword({ data: { userId, password } });
    return { ok: true, password };
  },

  async register() {
    const err = new Error('O cadastro é feito pelo estúdio. Fale com a administradora.');
    err.code = 'not_registered';
    throw err;
  },

  async updateMe(data) {
    const id = await currentUserId();
    if (!id) throw new Error('not authenticated');
    return userEntity.update(id, data);
  },

  async logout() {
    if (isBrowser) {
      try {
        window.localStorage.removeItem(REMEMBER_KEY);
        window.sessionStorage.removeItem(SESSION_MARK);
      } catch {
        /* noop */
      }
    }
    await supabase.auth.signOut();
  },

  async resetPasswordRequest(email) {
    const redirectTo = isBrowser ? `${window.location.origin}/redefinir-senha` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(String(email || '').trim().toLowerCase(), {
      redirectTo,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  },

  async resetPassword(newPassword) {
    return auth.changePassword(newPassword);
  },

  async resendOtp() {
    return { ok: true };
  },
  async verifyOtp() {
    return { ok: true };
  },
  setToken() {},
  redirectToLogin() {
    if (isBrowser) window.location.assign('/login');
  },
};

/* ------------------------------------------------------------------ */
/* Integrações                                                         */
/* ------------------------------------------------------------------ */

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
  async invoke() {
    return { ok: true };
  },
};

export const base44 = { entities, auth, integrations, functions };
