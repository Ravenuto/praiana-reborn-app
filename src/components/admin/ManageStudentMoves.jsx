import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Loader2, Plus, Save, Trash2, Copy, Search } from "lucide-react";
import { toast } from "sonner";
import { createNotification } from "@/hooks/useNotifications";
import { LEVELS, MOVE_CATEGORIES, SKILL_LEVELS, currentMonth, monthLabel, planProgress, prevMonth, recentMonths, skillInfo } from "@/lib/moves";
import { MoveForm } from "@/components/admin/ManageMoves";

const MONTHS = recentMonths(12);

export default function ManageStudentMoves() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [creatingSaving, setCreatingSaving] = useState(false);
  const [newMove, setNewMove] = useState({
    name: "",
    category: MOVE_CATEGORIES[0],
    skill_level: SKILL_LEVELS[0].key,
    bilateral: true,
    notes: "",
  });

  const { data: users = [] } = useQuery({
    queryKey: ["moveStudents"],
    queryFn: () => base44.entities.User.list(),
  });
  const students = useMemo(
    () => users.filter((u) => u.role !== "admin" && !u.is_admin && u.email),
    [users]
  );

  const { data: moves = [] } = useQuery({
    queryKey: ["moves"],
    queryFn: () => base44.entities.Move.list("display_order"),
  });

  const { data: plan, isFetching } = useQuery({
    queryKey: ["studentMovePlan", email, month],
    queryFn: async () => {
      const rows = await base44.entities.StudentMovePlan.filter({ student_email: email, month });
      return rows?.[0] || null;
    },
    enabled: !!email && !!month,
  });

  useEffect(() => {
    setItems(plan?.items ? [...plan.items] : []);
    setNotes(plan?.notes || "");
  }, [plan, email, month]);

  const addMove = (m) => {
    if (items.some((it) => it.move_id === m.id)) return;
    setItems((prev) => [
      ...prev,
      {
        move_id: m.id,
        name: m.name,
        category: m.category,
        skill_level: m.skill_level || "pole_base",
        bilateral: m.bilateral !== false,
        left_level: "a_treinar",
        right_level: "a_treinar",
        order: prev.length,
      },
    ]);
  };

  const removeItem = (moveId) => setItems((prev) => prev.filter((it) => it.move_id !== moveId));

  const setLevel = (moveId, side, level) =>
    setItems((prev) => prev.map((it) => (it.move_id === moveId ? { ...it, [side]: level } : it)));

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const next = [...items];
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setItems(next.map((it, i) => ({ ...it, order: i })));
  };

  const copyPrevious = async () => {
    const pm = prevMonth(month);
    const rows = await base44.entities.StudentMovePlan.filter({ student_email: email, month: pm });
    const prev = rows?.[0];
    if (!prev?.items?.length) return toast.error(`Nada encontrado em ${monthLabel(pm)}`);
    setItems(prev.items.map((it, i) => ({ ...it, order: i })));
    setNotes(prev.notes || "");
    toast.success(`Copiado de ${monthLabel(pm)}`);
  };

  const handleSave = async () => {
    if (!email) return toast.error("Escolha uma aluna");
    setSaving(true);
    try {
      const payload = {
        student_email: email,
        month,
        notes,
        items: items.map((it, i) => ({ ...it, order: i })),
        updated_date: new Date().toISOString(),
      };
      if (plan?.id) await base44.entities.StudentMovePlan.update(plan.id, payload);
      else await base44.entities.StudentMovePlan.create(payload);

      await createNotification({
        user_email: email,
        type: "moves_plan",
        title: "Seus movimentos do mês estão prontos 💙",
        message: `Confira os movimentos de ${monthLabel(month)} no seu perfil.`,
        link: "/perfil",
      });

      queryClient.invalidateQueries({ queryKey: ["studentMovePlan"] });
      queryClient.invalidateQueries({ queryKey: ["myMovePlan"] });
      toast.success("Plano do mês salvo!");
    } catch {
      toast.error("Erro ao salvar");
    }
    setSaving(false);
  };

  const handleCreateMove = async () => {
    if (!newMove.name.trim()) return toast.error("Nome é obrigatório");
    if (!newMove.category?.trim()) return toast.error("Escolha uma categoria");
    setCreatingSaving(true);
    try {
      const created = await base44.entities.Move.create({ ...newMove, display_order: moves.length });
      await queryClient.invalidateQueries({ queryKey: ["moves"] });
      addMove(created);
      setNewMove({ name: "", category: MOVE_CATEGORIES[0], skill_level: SKILL_LEVELS[0].key, bilateral: true, notes: "" });
      setCreating(false);
      toast.success("Movimento criado e adicionado");
    } catch {
      toast.error("Erro ao criar movimento");
    }
    setCreatingSaving(false);
  };

  const term = search.trim().toLowerCase();
  const available = moves.filter((m) => {
    if (items.some((it) => it.move_id === m.id)) return false;
    if (term && !(m.name || "").toLowerCase().includes(term) && !(m.category || "").toLowerCase().includes(term)) return false;
    if (catFilter !== "all" && (m.category || "Outros") !== catFilter) return false;
    if (levelFilter !== "all" && (m.skill_level || "pole_base") !== levelFilter) return false;
    return true;
  });
  const allCats = [
    ...MOVE_CATEGORIES,
    ...[...new Set(moves.map((m) => m.category).filter((c) => c && !MOVE_CATEGORIES.includes(c)))],
  ];
  const categories = [...new Set(available.map((m) => m.category || "Outros"))].sort(
    (a, b) => allCats.indexOf(a) - allCats.indexOf(b)
  );
  const progress = planProgress(items);


  return (
    <div>
      <h2 className="font-heading text-base font-semibold mb-4">Movimentos do mês da aluna</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="min-w-0">
          <Label className="text-xs mb-1 block">Aluna</Label>
          <select
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mobile-native-field h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Selecione…</option>
            {students.map((s) => (
              <option key={s.id} value={s.email}>{s.full_name || s.email}</option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <Label className="text-xs mb-1 block">Mês</Label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="mobile-native-field h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
          >
            {MONTHS.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
      </div>

      {!email ? (
        <p className="text-sm text-muted-foreground">Selecione uma aluna para montar o plano do mês.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-full gap-2 text-xs">
                  <Plus className="h-4 w-4" /> Adicionar movimentos
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-heading">Adicionar movimentos</DialogTitle>
                </DialogHeader>
                <div className="relative my-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar…"
                    className="pl-9 w-full min-w-0"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  <PickChip active={catFilter === "all"} onClick={() => setCatFilter("all")}>Todas</PickChip>
                  {allCats.map((c) => (
                    <PickChip key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>{c}</PickChip>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <PickChip active={levelFilter === "all"} onClick={() => setLevelFilter("all")}>Todos os níveis</PickChip>
                  {SKILL_LEVELS.map((l) => (
                    <PickChip key={l.key} active={levelFilter === l.key} onClick={() => setLevelFilter(l.key)}>
                      {l.label}
                    </PickChip>
                  ))}
                </div>

                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nada para adicionar com esses filtros.</p>
                ) : (
                  <div className="space-y-4">
                    {categories.map((cat) => (
                      <div key={cat}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{cat}</p>
                        <div className="flex flex-wrap gap-2">
                          {available.filter((m) => (m.category || "Outros") === cat).map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => addMove(m)}
                              className="px-3 py-1.5 rounded-full text-xs border border-border bg-muted/40 hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              + {m.name}
                              <span className="ml-1.5 opacity-60">{skillInfo(m.skill_level).short}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-border">
                  {creating ? (
                    <MoveForm
                      form={newMove}
                      setForm={setNewMove}
                      onSave={handleCreateMove}
                      saving={creatingSaving}
                      editing={false}
                    />
                  ) : (
                    <Button variant="outline" size="sm" className="rounded-full gap-2 text-xs w-full" onClick={() => setCreating(true)}>
                      <Plus className="h-4 w-4" /> Criar novo movimento na biblioteca
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button size="sm" variant="outline" className="rounded-full gap-2 text-xs" onClick={copyPrevious}>
              <Copy className="h-4 w-4" /> Copiar mês anterior
            </Button>
          </div>

          {items.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso do mês</span>
                <span>{progress.done}/{progress.total} dominados</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress.pct}%` }} />
              </div>
            </div>
          )}

          {isFetching && items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground mb-4">Nenhum movimento neste mês ainda.</p>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="move-plan">
                {(dp) => (
                  <div ref={dp.innerRef} {...dp.droppableProps} className="space-y-2 mb-5">
                    {items.map((it, index) => (
                      <Draggable key={it.move_id} draggableId={String(it.move_id)} index={index}>
                        {(dr) => (
                          <div
                            ref={dr.innerRef}
                            {...dr.draggableProps}
                            className="rounded-xl border border-border bg-card p-3"
                          >
                            <div className="flex items-start gap-2">
                              <span {...dr.dragHandleProps} className="mt-1 text-muted-foreground cursor-grab">
                                <GripVertical className="h-4 w-4" />
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-sm truncate">{it.name}</p>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${skillInfo(it.skill_level).badge}`}>
                                    {skillInfo(it.skill_level).short}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{it.category}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <SideSelect
                                    label={it.bilateral === false ? "Nível" : "Lado esquerdo"}
                                    value={it.left_level}
                                    onChange={(v) => setLevel(it.move_id, "left_level", v)}
                                  />
                                  {it.bilateral !== false && (
                                    <SideSelect
                                      label="Lado direito"
                                      value={it.right_level}
                                      onChange={(v) => setLevel(it.move_id, "right_level", v)}
                                    />
                                  )}
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeItem(it.move_id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {dp.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          <div className="mb-4">
            <Label className="text-xs mb-1 block">Anotação do mês (foco / meta)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: foco em força de braço e limpeza dos giros"
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full rounded-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar plano do mês</>}
          </Button>
        </>
      )}
    </div>
  );
}

function PickChip({ active, onClick, children }) {
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

function SideSelect({ label, value, onChange }) {
  return (
    <div className="min-w-0">
      <span className="text-[11px] text-muted-foreground block mb-0.5">{label}</span>
      <select
        value={value || "a_treinar"}
        onChange={(e) => onChange(e.target.value)}
        className="mobile-native-field h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-xs"
      >
        {LEVELS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
      </select>
    </div>
  );
}
