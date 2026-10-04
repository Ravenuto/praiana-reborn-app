import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addMonths, forecastForMonth, money, monthDate } from "@/lib/financialForecast";

const currentMonth = () => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Bahia", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
};
const monthLabel = (month) => new Date(`${month}-15T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

export default function FinancialForecast() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(currentMonth);
  const [editing, setEditing] = useState(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const { data: students = [], isLoading: loadingStudents, error: studentsError } = useQuery({ queryKey: ["allUsers"], queryFn: () => base44.entities.User.list() });
  const { data: plans = [], isLoading: loadingPlans, error: plansError } = useQuery({ queryKey: ["studioPlans"], queryFn: () => base44.entities.StudioPlan.list() });
  const { data: entries = [], isLoading: loadingEntries, error: entriesError } = useQuery({
    queryKey: ["financialForecastEntries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("financial_forecast_entries").select("*");
      if (error) throw error;
      return data || [];
    },
  });
  const rows = forecastForMonth(students, plans, entries, month);
  const total = rows.reduce((sum, row) => sum + row.cents, 0);

  const openEdit = (row) => {
    setEditing(row);
    setValue(((row.kind === "allocation" ? row.total : row.cents) / 100).toFixed(2));
  };

  const save = async () => {
    if (!editing) return;
    const amount = Number(String(value).replace(",", "."));
    if (!Number.isFinite(amount) || amount < 0 || !String(value).trim()) return toast.error("Informe um valor válido.");
    const cents = Math.round(amount * 100);
    const isAllocation = editing.kind === "allocation";
    const record = {
      student_id: editing.student.id,
      kind: isAllocation ? "allocation" : "monthly_override",
      month: monthDate(isAllocation ? editing.start : month),
      amount_cents: cents,
      installments: isAllocation ? editing.count : 1,
      plan_key: editing.plan.key,
    };
    setSaving(true);
    const { error } = await supabase.from("financial_forecast_entries").upsert(record, { onConflict: "student_id,kind,month" });
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar o valor.");
    await queryClient.invalidateQueries({ queryKey: ["financialForecastEntries"] });
    setEditing(null);
    toast.success("Valor salvo.");
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-xl font-semibold uppercase">Controle mensal</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" title="Mês anterior" aria-label="Mês anterior" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="min-w-32 text-center text-sm font-medium capitalize" aria-live="polite">{monthLabel(month)}</span>
          <Button variant="outline" size="icon" title="Próximo mês" aria-label="Próximo mês" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="border-y border-border py-5">
        <p className="text-xs uppercase text-muted-foreground">Retirada planejada em {monthLabel(month)}</p>
        <p className="font-heading text-3xl font-semibold text-primary mt-1">{money(total)}</p>
      </div>
      {loadingStudents || loadingPlans || loadingEntries ? <p className="text-sm text-muted-foreground">Carregando…</p> : studentsError || plansError || entriesError ? <p className="text-sm text-destructive">Não foi possível carregar o controle mensal.</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground py-6">Nenhuma retirada prevista para este mês.</p> : (
        <div className="divide-y divide-border border-y border-border">
          {rows.map((row) => (
            <div key={row.student.id} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] gap-2 sm:gap-4 items-center py-4">
              <div className="min-w-0"><p className="font-medium truncate">{row.student.full_name || row.student.email}</p><p className="text-xs text-muted-foreground truncate sm:hidden">{row.plan.label}</p></div>
              <p className="hidden sm:block text-sm text-muted-foreground truncate">{row.plan.label}</p>
              <div className="text-right"><p className="font-semibold tabular-nums whitespace-nowrap">{money(row.cents)}</p><p className="text-xs text-muted-foreground whitespace-nowrap">{row.kind === "allocation" ? `${row.offset + 1} de ${row.count}${row.allocation ? "" : " · confirmar total"}` : row.override ? "Valor ajustado" : "Mensal"}</p></div>
              <Button variant="ghost" size="icon" title={row.kind === "allocation" ? "Editar total recebido" : "Editar apenas este mês"} aria-label={`Editar valor de ${row.student.full_name || row.student.email}`} onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!editing} onOpenChange={(open) => { if (!open && !saving) setEditing(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing?.kind === "allocation" ? "Total recebido pelo plano" : "Valor deste mês"}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{editing?.student.full_name || editing?.student.email}</p>
          {editing?.kind === "allocation" && <p className="text-sm text-muted-foreground">O total será dividido em {editing.count} retiradas mensais, começando em {monthLabel(editing.start)}. Continua mesmo se a aluna ficar inativa.</p>}
          <label className="text-sm font-medium" htmlFor="forecast-amount">Valor em reais</label>
          <Input id="forecast-amount" type="number" min="0" step="0.01" value={value} onChange={(event) => setValue(event.target.value)} />
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}