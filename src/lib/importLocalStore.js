// Importa uma única vez os dados que ficaram salvos no navegador do estúdio
// (versão antiga do app) para o servidor.
import { supabase } from '@/integrations/supabase/client';
import { base44 } from '@/api/base44Client';

const STORE_KEY = 'raissa_mock_store_v1';
const DONE_KEY = 'raissa_import_done_v1';

const RECORD_COLLECTIONS = [
  'ClassType',
  'ClassSession',
  'Booking',
  'StudioPlan',
  'Post',
  'Comment',
  'Notice',
  'Poll',
  'Notification',
  'PaymentHistory',
  'Holiday',
  'StudioSettings',
  'StudentInvitation',
  'WaitlistEntry',
  'Move',
  'StudentMovePlan',
];

export async function importLocalStoreOnce() {
  if (typeof window === 'undefined') return { imported: false };
  try {
    if (window.localStorage.getItem(DONE_KEY)) return { imported: false };
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return { imported: false };
    const store = JSON.parse(raw);

    const { data: existing, error } = await supabase
      .from('app_records')
      .select('id')
      .limit(1);
    if (error) throw error;
    if (existing && existing.length) {
      window.localStorage.setItem(DONE_KEY, '1');
      return { imported: false };
    }

    const owner = (await supabase.auth.getUser()).data?.user?.id || null;
    const rows = [];
    RECORD_COLLECTIONS.forEach((collection) => {
      (store[collection] || []).forEach((item) => {
        const { id, created_date, ...rest } = item || {};
        rows.push({
          id: String(id || `${collection}-${Math.random().toString(36).slice(2, 9)}`),
          collection,
          owner_id: owner,
          data: rest,
          created_date: created_date || new Date().toISOString(),
        });
      });
    });

    if (rows.length) {
      for (let i = 0; i < rows.length; i += 200) {
        const { error: insertError } = await supabase
          .from('app_records')
          .insert(rows.slice(i, i + 200));
        if (insertError) throw insertError;
      }
    }

    // Contas: cria no servidor as alunas/professoras que existiam localmente.
    const meEmail = ((await supabase.auth.getUser()).data?.user?.email || '').toLowerCase();
    const localUsers = (store.User || []).filter(
      (u) => u.email && u.email.toLowerCase() !== meEmail,
    );
    let createdUsers = 0;
    for (const u of localUsers) {
      try {
        const { id, password, created_date, ...rest } = u;
        await base44.entities.User.create(rest);
        createdUsers += 1;
      } catch {
        /* ignora contas duplicadas ou inválidas */
      }
    }

    window.localStorage.setItem(DONE_KEY, '1');
    return { imported: true, records: rows.length, users: createdUsers };
  } catch {
    return { imported: false };
  }
}

export default importLocalStoreOnce;
