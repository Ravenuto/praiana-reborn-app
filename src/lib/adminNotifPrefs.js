import { base44 } from "@/api/base44Client";

export const SETTINGS_KEY = "admin_notif_prefs";

// Tipos de notificação que a administração pode receber
export const ADMIN_NOTIF_TYPES = [
  { type: "booking_made", label: "Novas reservas", description: "Quando uma aluna reserva uma aula" },
  { type: "booking_cancelled", label: "Cancelamentos", description: "Quando uma aluna cancela uma reserva" },
  { type: "waitlist_promoted", label: "Fila de espera", description: "Quando alguém entra na aula pela fila de espera" },
  { type: "like", label: "Curtidas", description: "Curtidas em posts e recados" },
  { type: "comment", label: "Comentários", description: "Comentários em posts e recados" },
  { type: "new_post", label: "Novas publicações", description: "Quando uma aluna publica no feed" },
  { type: "credits_added", label: "Pagamentos e créditos", description: "Confirmações de pagamento e créditos" },
];

export const DEFAULT_PREFS = ADMIN_NOTIF_TYPES.reduce((acc, t) => ({ ...acc, [t.type]: true }), {});

let _cache = null;

export async function getAdminNotifPrefs({ fresh = false } = {}) {
  if (_cache && !fresh) return _cache;
  try {
    const rows = await base44.entities.StudioSettings.filter({ key: SETTINGS_KEY });
    const raw = rows?.[0]?.value;
    const parsed = raw ? JSON.parse(raw) : {};
    _cache = { ...DEFAULT_PREFS, ...parsed };
  } catch {
    _cache = { ...DEFAULT_PREFS };
  }
  return _cache;
}

export async function saveAdminNotifPrefs(prefs) {
  const value = JSON.stringify(prefs);
  const rows = await base44.entities.StudioSettings.filter({ key: SETTINGS_KEY });
  if (rows?.[0]) await base44.entities.StudioSettings.update(rows[0].id, { value });
  else await base44.entities.StudioSettings.create({ key: SETTINGS_KEY, value });
  _cache = { ...DEFAULT_PREFS, ...prefs };
  return _cache;
}

export function clearAdminNotifPrefsCache() {
  _cache = null;
}
