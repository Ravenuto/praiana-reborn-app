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
import { MOVE_CATEGORIES, SKILL_LEVELS, skillInfo } from "@/lib/moves";

const emptyForm = {
  name: "",
  category: MOVE_CATEGORIES[0],
  skill_level: SKILL_LEVELS[0].key,
  bilateral: true,
  notes: "",
};

export default function ManageMoves() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const { data: moves = [], isLoading } = useQuery({
    queryKey: ["moves"],
    queryFn: () => base44.entities.Move.list("display_order"),
  });

  const reset = () => { setForm(emptyForm); setEditingId(null); };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Nome é obrigatório");
    if (!form.category?.trim()) return toast.error("Escolha uma categoria");
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
      skill_level: m.skill_level || SKILL_LEVELS[0].key,
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
  const filtered = moves.filter((m) => {
    if (term && !(m.name || "").toLowerCase().includes(term) && !(m.category || "").toLowerCase().includes(term)) return false;
    if (catFilter !== "all" && (m.category || "Outros") !== catFilter) return false;
    if (levelFilter !== "all" && (m.skill_level || "pole_base") !== levelFilter) return false;
    return true;
  });

  const extraCats = [...new Set(moves.map((m) => m.category).filter((c) => c && !MOVE_CATEGORIES.includes(c)))];
  const allCats = [...MOVE_CATEGORIES, ...extraCats];

  const grouped = allCats
    .map((cat) => ({ cat, items: filtered.filter((m) => m.category === cat) }))
    .concat([{ cat: "Outros", items: filtered.filter((m) => !m.category) }])
    .filter((g) => g.items.length > 0);

  const countFor = (level) => moves.filter((m) => (m.skill_level || "pole_base") === level).length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-heading text-base font-semibold">Biblioteca de movimentos</h2>
          <p className="text-xs text-muted-foreground">{moves.length} movimentos cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full gap-2 text-xs shrink-0">
              <Plus className="h-4 w-4" /> Novo movimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">{editingId ? "Editar" : "Novo"} movimento</DialogTitle>
            </DialogHeader>
            <MoveForm form={form} setForm={setForm} onSave={handleSave} saving={saving} editing={!!editingId} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar movimento"
          className="pl-9 w-full min-w-0"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        <Chip active={catFilter === "all"} onClick={() => setCatFilter("all")}>Todas</Chip>
        {allCats.map((c) => (
          <Chip key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>{c}</Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-5">
        <Chip active={levelFilter === "all"} onClick={() => setLevelFilter("all")}>Todos os níveis</Chip>
        {SKILL_LEVELS.map((l) => (
          <Chip key={l.key} active={levelFilter === l.key} onClick={() => setLevelFilter(l.key)}>
            {l.label} ({countFor(l.key)})
          </Chip>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum movimento encontrado.</p>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ cat, items }) => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {cat} <span className="font-normal normal-case">· {items.length}</span>
              </p>
              <div className="grid gap-2">
                {items.map((m) => {
                  const sk = skillInfo(m.skill_level);
                  return (
                    <Card key={m.id}>
                      <CardContent className="p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm truncate">{m.name}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sk.badge}`}>{sk.short}</span>
                          </div>
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
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function MoveForm({ form, setForm, onSave, saving, editing }) {
  const isCustomCat = !!form.category && !MOVE_CATEGORIES.includes(form.category);
  return (
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
        <Label className="mb-1.5 block">Categoria</Label>
        <div className="flex flex-wrap gap-1.5">
          {MOVE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, category: c })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                form.category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setForm({ ...form, category: isCustomCat ? form.category : "" })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isCustomCat || form.category === "" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Outra…
          </button>
        </div>
        {(isCustomCat || form.category === "") && (
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Nome da categoria"
            className="mt-2 w-full min-w-0"
          />
        )}
      </div>

      <div>
        <Label className="mb-1.5 block">Nível</Label>
        <div className="flex flex-wrap gap-1.5">
          {SKILL_LEVELS.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => setForm({ ...form, skill_level: l.key })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                (form.skill_level || SKILL_LEVELS[0].key) === l.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
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
          <span className="block text-xs text-muted-foreground">Desmarque para movimentos sem lados.</span>
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

      <Button onClick={onSave} disabled={saving} className="w-full rounded-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Salvar alterações" : "Criar movimento"}
      </Button>
    </div>
  );
}
