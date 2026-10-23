import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyNotificationPreferences, saveMyNotificationPreferences } from '@/lib/studentNotifPrefs.functions';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Bell, Mail, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('both');
  const [saving, setSaving] = useState(false);
  const { data, isLoading, isError } = useQuery({ queryKey: ['studentNotificationPreferences', user?.id], queryFn: () => getMyNotificationPreferences(), enabled: !!user?.id });
  useEffect(() => { if (data) setMode(data); }, [data]);
  const save = async () => {
    setSaving(true);
    try { await saveMyNotificationPreferences({ data: { mode } }); await queryClient.invalidateQueries({ queryKey: ['studentNotificationPreferences'] }); toast.success('Preferências salvas!'); }
    catch { toast.error('Não foi possível salvar suas preferências.'); }
    finally { setSaving(false); }
  };
  return <section className="space-y-4 border-t border-border pt-5">
    <h2 className="font-heading font-semibold text-lg flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notificações</h2>
    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : isError ? <p className="text-sm text-destructive">Não foi possível carregar suas preferências.</p> : <>
      <RadioGroup value={mode} onValueChange={setMode} aria-label="Receber notificações" className="gap-3">
        {[['both', 'E-mail e aplicativo', Bell], ['email', 'Somente e-mail', Mail], ['app', 'Somente aplicativo', Bell]].map(([value, label, Icon]) => <Label key={value} htmlFor={`delivery-${value}`} className="flex items-center gap-3 rounded-lg border border-border p-4 cursor-pointer">
          <RadioGroupItem id={`delivery-${value}`} value={value} /><Icon className="h-4 w-4 text-primary" /><span>{label}</span>
        </Label>)}
      </RadioGroup>
      <Button onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar preferências</Button>
    </>}
  </section>;
}