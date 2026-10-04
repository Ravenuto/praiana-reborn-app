import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { notifyAllStudents } from "@/hooks/useNotifications";
import { sortClassTypes } from "@/lib/classTypeOrder";

const emptyForm = { name: "", description: "", duration_minutes: 60, max_students: 8, color: "#c2185b", show_in_app: true };

export default function ManageClassTypes() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);

  const { data: classTypes = [], isLoading } = useQuery({
    queryKey: ["classTypes"],
    queryFn: () => base44.entities.ClassType.list(),
  });
  const orderedTypes = sortClassTypes(classTypes);

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Nome é obrigatório");
    setSaving(true);
    try {
      if (editingId) {
        await base44.entities.ClassType.update(editingId, form);
        toast.success("Modalidade atualizada");
      } else {
        const lastOrder = Math.max(-1, ...orderedTypes.map((ct, index) => Number.isFinite(Number(ct.sort_order)) && ct.sort_order != null ? Number(ct.sort_order) : index));
        await base44.entities.ClassType.create({ ...form, is_active: true, sort_order: lastOrder + 1 });
        if (form.show_in_app !== false) {
          notifyAllStudents({
            type: "new_notice",
            title: "Nova modalidade disponível 🎉",
            message: `${form.name} já está disponível na grade.`,
            link: "/agenda",
          });
        }
        toast.success("Modalidade criada");
      }
      queryClient.invalidateQueries({ queryKey: ["classTypes"] });
      setOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch {
      toast.error("Erro ao salvar");
    }
    setSaving(false);
  };

  const handleEdit = (ct) => {
    setForm({
      name: ct.name || "",
      description: ct.description || "",
      duration_minutes: ct.duration_minutes || 60,
      max_students: ct.max_students || 8,
      color: ct.color || "#c2185b",
      show_in_app: ct.show_in_app !== false,
    });
    setEditingId(ct.id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    await base44.entities.ClassType.delete(id);
    queryClient.invalidateQueries({ queryKey: ["classTypes"] });
    toast.success("Modalidade excluída");
  };

  const moveClassType = async (index, direction) => {
    if (reordering || index + direction < 0 || index + direction >= orderedTypes.length) return;
    const reordered = [...orderedTypes];
    [reordered[index], reordered[index + direction]] = [reordered[index + direction], reordered[index]];
    setReordering(true);
    try {
      // Only the exchanged positions change. Existing unsorted rows keep their order until moved.
      const current = orderedTypes[index];
      const neighbor = orderedTypes[index + direction];
      const before = orderedTypes[Math.min(index, index + direction) - 1];
      const after = orderedTypes[Math.max(index, index + direction) + 1];
      const previousOrder = Number(before?.sort_order);
      const followingOrder = Number(after?.sort_order);
      const lower = before && before.sort_order != null && Number.isFinite(previousOrder) ? previousOrder : -1;
      const upper = after && after.sort_order != null && Number.isFinite(followingOrder) ? followingOrder : orderedTypes.length + 1;
      const left = Math.min(index, index + direction) === index ? neighbor : current;
      const right = left === current ? neighbor : current;
      const leftOrder = lower + (upper - lower) / 3;
      const rightOrder = lower + (2 * (upper - lower)) / 3;
      await base44.entities.ClassType.update(left.id, { sort_order: leftOrder });
      await base44.entities.ClassType.update(right.id, { sort_order: rightOrder });
      toast.success("Ordem das modalidades atualizada");
    } catch {
      toast.error("Não foi possível alterar a ordem");
    } finally {
      await queryClient.invalidateQueries({ queryKey: ["classTypes"] });
      setReordering(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
         <h2 className="font-heading text-base font-semibold">Modalidades</h2>
         <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
           <DialogTrigger asChild>
             <Button size="sm" className="rounded-full gap-2 text-xs">
               <Plus className="h-4 w-4" /> Nova Modalidade
             </Button>
           </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">{editingId ? "Editar" : "Nova"} Modalidade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Pole Dance" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição da modalidade" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duração (min)</Label>
                  <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })} />
                </div>
                <div>
                  <Label>Máx. Alunas</Label>
                  <Input type="number" value={form.max_students} onChange={(e) => setForm({ ...form, max_students: parseInt(e.target.value) || 8 })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none p-3 rounded-xl bg-muted/30 border border-border">
                <input
                  type="checkbox"
                  checked={form.show_in_app !== false}
                  onChange={(e) => setForm({ ...form, show_in_app: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                <span>
                  <span className="font-medium">Mostrar no app das alunas</span>
                  <span className="block text-xs text-muted-foreground">Desmarque para aulas especiais — fica visível só ao admin.</span>
                </span>
              </label>
              <Button onClick={handleSave} disabled={saving} className="w-full rounded-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Salvar Alterações" : "Criar Modalidade"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {orderedTypes.map((ct, index) => (
          <Card key={ct.id}>
            <CardContent className="p-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ct.color || "#c2185b" }} />
                <div className="min-w-0">
                  <p className="font-semibold text-sm flex flex-wrap items-center gap-2">
                    {ct.name}
                    {ct.show_in_app === false && (
                      <span className="text-[10px] uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Oculta no app</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{ct.duration_minutes || 60}min · Até {ct.max_students || 8} alunas</p>
                </div>
              </div>
              <div className="flex gap-0.5 shrink-0">
                <Button variant="ghost" size="icon" title="Subir modalidade" aria-label={`Subir ${ct.name}`} disabled={reordering || index === 0} onClick={() => moveClassType(index, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Descer modalidade" aria-label={`Descer ${ct.name}`} disabled={reordering || index === orderedTypes.length - 1} onClick={() => moveClassType(index, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Editar modalidade" aria-label={`Editar ${ct.name}`} onClick={() => handleEdit(ct)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Excluir modalidade" aria-label={`Excluir ${ct.name}`} onClick={() => handleDelete(ct.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}