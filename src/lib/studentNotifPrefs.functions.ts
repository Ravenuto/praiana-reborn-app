import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const getMyNotificationPreferences = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from('profiles').select('data').eq('id', context.userId).single();
    if (error) throw error;
    const mode = (data.data as Record<string, unknown>)?.notification_delivery;
    return ['both', 'email', 'app'].includes(String(mode)) ? String(mode) : 'both';
  });

export const saveMyNotificationPreferences = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ mode: z.enum(['both', 'email', 'app']) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from('profiles').select('data').eq('id', context.userId).single();
    if (error) throw error;
    // Do not resend balances from a profile snapshot: booking triggers own credits.
    const details = { ...(row.data as Record<string, unknown>) };
    delete details.credits;
    delete details._reset_plan_credits;
    const { error: saveError } = await context.supabase.from('profiles').update({ data: { ...details, notification_delivery: data.mode } }).eq('id', context.userId);
    if (saveError) throw saveError;
    return { mode: data.mode };
  });