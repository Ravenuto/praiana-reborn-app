import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/** Cria (ou reativa) uma conta de aluna, professora ou administradora. */
export const adminCreateUser = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      email: string;
      roles: Array<'admin' | 'teacher' | 'student'>;
      profile: Record<string, unknown>;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const helpers = await import('@/lib/adminUsers.server');
    const { data: isAdmin, error: roleError } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (roleError || !isAdmin) throw new Error('Forbidden');
    if (!data.email) throw new Error('E-mail obrigatório');
    if (await helpers.findAuthUserByEmail(data.email)) {
      throw new Error('Este e-mail já está cadastrado. Use a opção de redefinir senha no cadastro existente.');
    }
    const user = await helpers.inviteStudioUser({
      email: data.email,
      roles: data.roles?.length ? data.roles : ['student'],
      profile: data.profile || {},
    });
    return { ...user, invitationSent: true };
  });

/** Reenvia o convite pendente ou envia recuperação para contas já confirmadas. */
export const adminSendPasswordLink = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const helpers = await import('@/lib/adminUsers.server');
    const { data: isAdmin, error: roleError } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (roleError || !isAdmin) throw new Error('Forbidden');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('email').eq('id', data.userId).single();
    if (profileError || !profile?.email) throw new Error('Conta não encontrada.');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (authError || !authUser.user || authUser.user.email?.toLowerCase() !== profile.email.toLowerCase()) {
      throw new Error('Conta de acesso não encontrada.');
    }
    if (authUser.user.invited_at && !authUser.user.confirmed_at) {
      const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(profile.email, {
        redirectTo: helpers.INVITE_REDIRECT,
      });
      if (error) throw new Error(error.message);
      return { ok: true, kind: 'invite' as const };
    }
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(profile.email, {
      redirectTo: helpers.RECOVERY_REDIRECT,
    });
    if (error) throw new Error(error.message);
    return { ok: true, kind: 'recovery' as const };
  });

/** Atualiza os papéis (aluna / professora / administradora) de uma conta. */
export const adminSetRoles = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; roles: Array<'admin' | 'teacher' | 'student'> }) => input)
  .handler(async ({ data, context }) => {
    const helpers = await import('@/lib/adminUsers.server');
    const { data: isAdmin, error: roleError } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (roleError || !isAdmin) throw new Error('Forbidden');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: target } = await supabaseAdmin.from('profiles').select('email').eq('id', data.userId).maybeSingle();
    if (target?.email?.toLowerCase() === helpers.ADMIN_EMAIL && !data.roles.includes('admin')) throw new Error('A administradora principal não pode ser rebaixada.');
    await helpers.setRoles(data.userId, data.roles || ['student']);
    return { ok: true };
  });

/** Remove uma conta do estúdio. */
export const adminDeleteUser = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const helpers = await import('@/lib/adminUsers.server');
    const { data: isAdmin, error: roleError } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (roleError || !isAdmin) throw new Error('Forbidden');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: target } = await supabaseAdmin.from('profiles').select('email').eq('id', data.userId).maybeSingle();
    if (target?.email?.toLowerCase() === helpers.ADMIN_EMAIL) throw new Error('A administradora principal não pode ser removida.');
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
