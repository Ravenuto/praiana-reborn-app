import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Save, Trash2 } from "lucide-react";
import { CLOSURE_TYPES, saveClosure } from "@/lib/studioClosures";
import { toast } from "sonner";

export default function StudioClosureDialog({ date, record, onClose, onSaved }) {
  const initialStart = record?.start_date || record?.date || date;
  const initialEnd = record?.end_date || initialStart;
  const [type, setType] = useState(record?.closure_type || "holiday");
  const [period, setPeriod] = useState(initialStart !== initialEnd);
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [message, setMessage] = useState(record?.message || CLOSURE_TYPES[type].message);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await saveClosure(base44.entities.Holiday, record?.id, { type, start, end: period ? end : start, message });
      await onSaved();
      toast.success("Fechamento salvo. Os planos continuam com as mesmas datas.");
      onClose();
    } catch (error) { toast.error(error?.message || "Não foi possível salvar."); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!record) return;
    setBusy(true);
    try {
      await base44.entities.Holiday.delete(record.id);
      await onSaved();
      toast.success("Fechamento removido.");
      onClose();
    } catch (error) { toast.error(error?.message || "Não foi possível remover."); }
    finally { setBusy(false); }
  }

  return <Dialog open onOpenChange={value => { if (!value && !busy) onClose(); }}>
    <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Fechamento do estúdio</DialogTitle><DialogDescription>{record ? "Editar fechamento" : "Novo fechamento"}</DialogDescription></DialogHeader>
      {confirmRemove ? <div className="space-y-4">
        <p className="text-sm">Remover este fechamento{initialStart !== initialEnd ? " de todo o período" : " do dia"}?</p>
        <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setConfirmRemove(false)}>Voltar</Button><Button variant="destructive" disabled={busy} onClick={remove}>Remover fechamento</Button></div>
      </div> : <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">{Object.entries(CLOSURE_TYPES).map(([key, value]) => <Button key={key} variant={type === key ? "default" : "outline"} disabled={busy} aria-pressed={type === key} onClick={() => { if (message === CLOSURE_TYPES[type]?.message) setMessage(value.message); setType(key); }}>{value.emoji} {value.label}</Button>)}</div>
        <div className="grid grid-cols-2 gap-2"><Button variant={!period ? "default" : "outline"} disabled={busy} aria-pressed={!period} onClick={() => setPeriod(false)}>Um dia</Button><Button variant={period ? "default" : "outline"} disabled={busy} aria-pressed={period} onClick={() => setPeriod(true)}>Período</Button></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="min-w-0 space-y-1"><Label htmlFor="closure-start">{period ? "De" : "Dia"}</Label><Input id="closure-start" type="date" className="mobile-native-field w-full block" value={start} disabled={busy} onChange={event => setStart(event.target.value)} /></div>
          {period && <div className="min-w-0 space-y-1"><Label htmlFor="closure-end">Até</Label><Input id="closure-end" type="date" className="mobile-native-field w-full block" value={end} min={start} disabled={busy} onChange={event => setEnd(event.target.value)} /></div>}
        </div>
        <div className="space-y-1"><Label htmlFor="closure-message">Mensagem para as alunas</Label><Textarea id="closure-message" rows={4} value={message} disabled={busy} onChange={event => setMessage(event.target.value)} /></div>
        <div className="flex justify-between gap-2">
          {record ? <Button variant="ghost" disabled={busy} onClick={() => setConfirmRemove(true)} className="text-destructive gap-2"><Trash2 className="h-4 w-4" />Remover</Button> : <Button variant="outline" disabled={busy} onClick={onClose}>Voltar</Button>}
          <Button disabled={busy} onClick={save} className="gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Salvar</Button>
        </div>
      </div>}
    </DialogContent>
  </Dialog>;
}