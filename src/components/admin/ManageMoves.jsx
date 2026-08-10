import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { MOVE_CATEGORIES } from "@/lib/moves";

const emptyForm = { name: "", category: MOVE_CATEGORIES[0], bilateral: true, notes: "" };

export default function ManageMoves() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const { data: moves = [], isLoading } = useQuery({
    queryKey: ["moves"],
    queryFn: () => base44.entities.Move.list("display_order"),
  });

  const reset = () => { setForm(emptyForm); setEditingId(null); };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Nome é obrigatório");
    setSaving(true);
    try {
      if (editingId) {
        await base44.entities.Move.update(editingId, form);
        toast.success("Movimento atualizado");
      } else {
        await base44.entities.Move.create({ ...form, display_order: moves.length });
        toast.success("Movimento criado");
      }
      queryClient.invalidateQueries({ queryKey: ["moves"] });
      setOpen(false);
      reset();
    } catch {
      toast.error("Erro ao salvar");
    }
    setSaving(false);
  };

  const handleEdit = (m) => {
    setForm({
      name: m.name || "",
      category: m.category || MOVE_CATEGORIES[0],
      bilateral: m.bilateral !== false,
      notes: m.notes || "",
    });
    setEditingId(m.id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este movimento da biblioteca?")) return;
    await base44.entities.Move.delete(id);
    queryClient.invalidateQueries({ queryKey: ["moves"] });
    toast.success("Movimento excluído");
  };

  const term = search.trim().toLowerCase();
  const filtered = moves.filter(
    (m) => !term || (m.name || "").toLowerCase().includes(term) || (m.category || "").toLowerCase().includes(term)
  );

  const grouped = MOVE_CATEGORIES.map((cat) => ({
    cat,
    items: filtered.filter((m) => m.category === cat),
  })).concat(
    [{ cat: "Outros", items: filtered.filter((m) => !MOVE_CATEGORIES.includes(m.category)) }]
  ).filter((g) => g.items.length > 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-heading text-base font-semibold">Biblioteca de movimentos</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full gap-2 text-xs">
              <Plus className="h-4 w-4" /> Novo movimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">{editingId ? "Editar" : "Novo"} movimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Fireman Spin"
                  className="w-full min-w-0"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <select
                  value={MOVE_CATEGORIES.includes(form.category) ? form.category : "__outra"}
                  onChange={(e) => setForm({ ...form, category: e.target.value === "__outra" ? "" : e.target.value })}
                  className="mobile-native-field mt-1 h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {MOVE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="__outra">Outra…</option>
                </select>
                {!MOVE_CATEGORIES.includes(form.category) && (
                  <Input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Nome da categoria"
                    className="mt-2 w-full min-w-0"
                  />
                )}
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none p-3 rounded-xl bg-muted/30 border border-border">
                <input
                  type="checkbox"
                  checked={form.bilateral !== false}
                  onChange={(e) => setForm({ ...form, bilateral: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                <span>
                  <span className="font-medium">Tem lado direito e esquerdo</span>
                  <span className="block text-xs text-muted-foreground">Desmarque para movimentos sem lados (ponte, coreografia…).</span>
                </span>
              </label>
              <div>
                <Label>Observação</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Dicas, pré-requisitos…"
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full rounded-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Salvar alterações" : "Criar movimento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar movimento ou categoria"
          className="pl-9 w-full min-w-0"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum movimento cadastrado ainda.</p>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ cat, items }) => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{cat}</p>
              <div className="grid gap-2">
                {items.map((m) => (
                  <Card key={m.id}>
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.bilateral === false ? "Sem lados" : "Direito e esquerdo"}
                          {m.notes ? ` · ${m.notes}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
