import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

// Notifications are often created by the studio, so their record owner is not the recipient.
// Verify the recipient before changing only their notification state.
export const updateMyNotifications = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { action: 'readAll' | 'readOne' | 'deleteOne'; id?: string }) => {
    if (!['readAll', 'readOne', 'deleteOne'].includes(input?.action)) throw new Error('Ação inválida');
    if (input.action !== 'readAll' && (!input.id || typeof input.id !== 'string')) throw new Error('Notificação inválida');
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: auth, error: authError } = await context.supabase.auth.getUser();
    const email = auth.user?.email?.toLowerCase();
    if (authError || !email || auth.user?.id !== context.userId) throw new Error('Acesso não autorizado');

    const { data: rows, error } = await context.supabase.from('app_records')
      .select('id, data')
      .eq('collection', 'Notification')
      .filter('data->>user_email', 'ilike', email);
    if (error) throw error;
    const matches = (rows || []).filter((row) =>
      String((row.data as { user_email?: string })?.user_email || '').toLowerCase() === email &&
      (data.action === 'readAll' ? (row.data as { read?: boolean })?.read !== true : row.id === data.id),
    );
    if (data.action !== 'readAll' && matches.length !== 1) throw new Error('Notificação não encontrada');
    if (!matches.length) return { ok: true };

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    for (const row of matches) {
      const result = data.action === 'deleteOne'
        ? await supabaseAdmin.from('app_records').delete().eq('id', row.id).eq('collection', 'Notification')
        : await supabaseAdmin.from('app_records').update({ data: { ...row.data, read: true } }).eq('id', row.id).eq('collection', 'Notification');
      if (result.error) throw result.error;
    }
    return { ok: true };
  });