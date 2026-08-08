import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save, Bell } from "lucide-react";
import { ADMIN_NOTIF_TYPES, DEFAULT_PREFS, getAdminNotifPrefs, saveAdminNotifPrefs } from "@/lib/adminNotifPrefs";

export default function ManageNotifPrefs() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setPrefs(await getAdminNotifPrefs({ fresh: true }));
      setLoading(false);
    })();
  }, []);

  const toggle = (type) => setPrefs((p) => ({ ...p, [type]: !p[type] }));

  const handleSave = async () => {
    setSaving(true);
    await saveAdminNotifPrefs(prefs);
    setSaving(false);
    toast.success("Preferências de notificação salvas!");
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5 max-w-md">
      <div>
        <h3 className="font-heading text-base font-semibold mb-1 flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" /> Minhas notificações
        </h3>
        <p className="text-xs text-muted-foreground">
          Escolha quais notificações você quer receber. As desativadas deixam de chegar para a administração.
        </p>
      </div>

      <div className="space-y-2">
        {ADMIN_NOTIF_TYPES.map((t) => (
          <div key={t.type} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">{t.label}</p>
              <p className="text-xs text-muted-foreground leading-tight">{t.description}</p>
            </div>
            <Switch checked={prefs[t.type] !== false} onCheckedChange={() => toggle(t.type)} />
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar preferências
      </Button>
    </div>
  );
}
