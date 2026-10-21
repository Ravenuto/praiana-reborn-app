import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { base44, ADMIN_EMAIL } from "@/api/base44Client";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { computeClassesTaught, DEFAULT_RATE_CENTS } from "@/lib/classesTaught";

const RATE_MONTH = "2000-01-01";
const money = (c) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ClassesTaught() {
  const qc = useQueryClient();
  const [anchor, setAnchor] = useState(new Date());
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const [value, setValue] = useState("");
  const month = format(anchor, "yyyy-MM");
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: users = [] } = useQuery({ queryKey: ["allUsers"], queryFn: () => base44.entities.User.list() });
  const { data: sessions = [] } = useQuery({ queryKey: ["allSessionsTaught"], queryFn: () => base44.entities.ClassSession.list() });
  const { data: bookings = [] } = useQuery({ queryKey: ["allBookingsTaught"], queryFn: () => base44.entities.Booking.list() });
  const { data: rates = [] } = useQuery({
    queryKey: ["teacherRates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("financial_forecast_entries").select("*").eq("kind", "teacher_rate");
      if (error) throw error;
      return data || [];
    },
  });

  const owner = users.find((u) => (u.email || "").toLowerCase() === ADMIN_EMAIL);
  const ownerName = owner?.full_name || "Raissa";
  const teachers = useMemo(() => {
    const list = users.filter((u) => u.role === "teacher" || u.is_teacher === true);
    if (owner && !list.some((t) => t.id === owner.id)) list.unshift(owner);
    return list;
  }, [users, owner]);

  const byTeacher = useMemo(
    () => computeClassesTaught({ bookings, sessions, month, today, ownerName }),
    [bookings, sessions, month, today, ownerName],
  );

  const rows = teachers.map((t) => {
    const name = t.full_name || t.email;
    const classes = byTeacher[name] || [];
    const rate = rates.find((r) => r.student_id === t.id)?.amount_cents ?? DEFAULT_RATE_CENTS;
    return { t, name, classes, rate };
  });
  const total = rows.reduce((s, r) => s + r.classes.length, 0);

  const saveRate = async () => {
    const cents = Math.round(Number(String(value).replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents < 0) return toast.error("Valor inválido");
    const { error } = await supabase.from("financial_forecast_entries").upsert(
      { student_id: editing.id, kind: "teacher_rate", month: RATE_MONTH, amount_cents: cents, installments: 1, plan_key: "" },
      { onConflict: "student_id,kind,month" },
    );
    if (error) return toast.error("Não foi possível salvar");
    qc.invalidateQueries({ queryKey: ["teacherRates"] });
    toast.success("Valor por aula atualizado");
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Mês anterior" onClick={() => setAnchor(addMonths(anchor, -1))}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="text-center">
          <p className="font-heading font-semibold capitalize">{format(anchor, "MMMM 'de' yyyy", { locale: ptBR })}</p>
          <p className="text-xs text-muted-foreground">{total} aulas dadas</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Próximo mês" onClick={() => setAnchor(addMonths(anchor, 1))}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      {rows.map(({ t, name, classes, rate }) => (
        <div key={t.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <button className="flex-1 min-w-0 text-left" onClick={() => setOpen(open === t.id ? null : t.id)}>
              <p className="font-semibold truncate">{name}</p>
              <p className="text-xs text-muted-foreground">{classes.length} aulas × {money(rate)}</p>
            </button>
            <p className="font-semibold tabular-nums">{money(classes.length * rate)}</p>
            <Button variant="ghost" size="icon" aria-label={`Editar valor por aula de ${name}`} onClick={() => { setEditing(t); setValue((rate / 100).toFixed(2)); }}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" aria-label="Ver aulas" onClick={() => setOpen(open === t.id ? null : t.id)}>{open === t.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button>
          </div>
          {open === t.id && (
            <div className="mt-3 divide-y divide-border border-t border-border">
              {classes.length === 0 && <p className="py-3 text-xs text-muted-foreground">Nenhuma aula dada neste mês.</p>}
              {classes.map((c) => (
                <div key={c.key} className="py-2 text-sm">
                  <p className="capitalize">{format(new Date(c.date + "T12:00:00"), "EEEE, dd/MM", { locale: ptBR })} · {c.time} – {c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.students.length} {c.students.length === 1 ? "aluna" : "alunas"}: {c.students.join(", ")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Valor por aula — {editing?.full_name || editing?.email}</DialogTitle></DialogHeader>
          <Input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
          <Button onClick={saveRate}>Salvar</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
