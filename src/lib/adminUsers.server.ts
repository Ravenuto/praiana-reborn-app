// Server-only helpers for managing studio accounts (auth users + profiles + roles).
import { supabaseAdmin } from '@/integrations/supabase/client.server';

export const ADMIN_EMAIL = 'ravenutto@gmail.com';
export const FALLBACK_DEFAULT_PASSWORD = 'praiana2026';

export type StudioRole = 'admin' | 'teacher' | 'student';

export async function assertCallerIsAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Forbidden');
}

export async function findAuthUserByEmail(email: string) {
  const target = email.trim().toLowerCase();
  // The Admin API has no direct "get by email", so scan the first pages.
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const found = data.users.find((u) => (u.email || '').toLowerCase() === target);
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

export async function setRoles(userId: string, roles: StudioRole[]) {
  await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
  const unique = Array.from(new Set(roles));
  if (unique.length) {
    const { error } = await supabaseAdmin
      .from('user_roles')
      .insert(unique.map((role) => ({ user_id: userId, role })));
    if (error) throw new Error(error.message);
  }
}

export async function upsertProfile(userId: string, email: string, patch: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: userId, email: email.trim().toLowerCase(), ...patch }, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function createStudioUser(input: {
  email: string;
  password: string;
  roles: StudioRole[];
  profile: Record<string, unknown>;
}) {
  const email = input.email.trim().toLowerCase();
  let userId: string;
  const existing = await findAuthUserByEmail(email);
  if (existing) {
    userId = existing.id;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: input.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.profile['full_name'] ?? '' },
    });
    if (error) throw new Error(error.message);
    userId = data.user!.id;
  }
  await upsertProfile(userId, email, input.profile);
  await setRoles(userId, input.roles);
  return { id: userId, email };
}

export async function adminExists() {
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin')
    .limit(1);
  if (error) throw new Error(error.message);
  return Boolean(data && data.length);
}
