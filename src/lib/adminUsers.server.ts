// Server-only helpers for managing studio accounts (auth users + profiles + roles).
import { supabaseAdmin } from '@/integrations/supabase/client.server';

export const ADMIN_EMAIL = 'ravenutto@gmail.com';
export const INVITE_REDIRECT = 'https://praianapoledance-app.com.br/criar-senha?origem=convite';
export const RECOVERY_REDIRECT = 'https://praianapoledance-app.com.br/criar-senha?origem=recuperacao';

export type StudioRole = 'admin' | 'teacher' | 'student';

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

/** An invited account has no password until the recipient opens the email link. */
export async function inviteStudioUser(input: {
  email: string;
  roles: StudioRole[];
  profile: Record<string, unknown>;
}) {
  const email = input.email.trim().toLowerCase();
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: INVITE_REDIRECT,
    data: { full_name: input.profile['full_name'] ?? '' },
  });
  if (error) throw new Error(error.message);
  const userId = data.user?.id;
  if (!userId) throw new Error('O convite não retornou a conta criada.');
  await upsertProfile(userId, email, { ...input.profile, must_change_password: true });
  await setRoles(userId, input.roles);
  return { id: userId, email };
}

