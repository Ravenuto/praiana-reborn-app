import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/** Cria a conta da administradora principal na primeira vez que o app roda. */
export const bootstrapAdmin = createServerFn({ method: 'POST' })
  .inputValidator((input: { email: string; password: string }) => input)
  .handler(async ({ data }) => {
    const helpers = await import('@/lib/adminUsers.server');
    const email = (data.email || '').trim().toLowerCase();
    if (email !== helpers.ADMIN_EMAIL) throw new Error('Forbidden');
    if (await helpers.adminExists()) return { created: false };
    const password = String(data.password || '');
    if (password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres');
    await helpers.createStudioUser({
      email,
      password,
      roles: ['admin'],
      profile: {
        full_name: 'Raissa Venuto',
        is_active: true,
        must_change_password: true,
        plan_status: 'active',
      },
    });
    return { created: true };
  });

/** Cria (ou reativa) uma conta de aluna, professora ou administradora. */
export const adminCreateUser = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      email: string;
      password: string;
      roles: Array<'admin' | 'teacher' | 'student'>;
      profile: Record<string, unknown>;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const helpers = await import('@/lib/adminUsers.server');
    await helpers.assertCallerIsAdmin(context.userId);
    if (!data.email) throw new Error('E-mail obrigatório');
    return helpers.createStudioUser({
      email: data.email,
      password: data.password || helpers.FALLBACK_DEFAULT_PASSWORD,
      roles: data.roles?.length ? data.roles : ['student'],
      profile: data.profile || {},
    });
  });

/** Define uma nova senha para uma conta (usada ao redefinir para a senha padrão). */
export const adminSetPassword = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; password: string }) => input)
  .handler(async ({ data, context }) => {
    const helpers = await import('@/lib/adminUsers.server');
    await helpers.assertCallerIsAdmin(context.userId);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const password = String(data.password || '');
    if (password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres');
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from('profiles').update({ must_change_password: true }).eq('id', data.userId);
    return { ok: true };
  });

/** Atualiza os papéis (aluna / professora / administradora) de uma conta. */
export const adminSetRoles = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; roles: Array<'admin' | 'teacher' | 'student'> }) => input)
  .handler(async ({ data, context }) => {
    const helpers = await import('@/lib/adminUsers.server');
    await helpers.assertCallerIsAdmin(context.userId);
    await helpers.setRoles(data.userId, data.roles || ['student']);
    return { ok: true };
  });

/** Remove uma conta do estúdio. */
export const adminDeleteUser = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const helpers = await import('@/lib/adminUsers.server');
    await helpers.assertCallerIsAdmin(context.userId);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
