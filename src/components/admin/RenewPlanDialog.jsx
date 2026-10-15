import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { planEndDate, getInstallments } from "@/lib/planDuration";
import { formatSafe } from "@/lib/dates";
import { sendPlanRenewedEmail } from "@/lib/notifications.functions";

export default function RenewPlanDialog({ student, plans, onClose }) {
  const queryClient = useQueryClient();
  const initialPlan = plans.find((p) => p.key === student.plan) ? student.plan : plans[0]?.key;
  const [planKey, setPlanKey] = useState(initialPlan || "");
  const [start, setStart] = useState(format(new Date(), "yyyy-MM-dd"));
  const [method, setMethod] = useState("pix");
  const [amount, setAmount] = useState(String(plans.find((p) => p.key === initialPlan)?.price_value ?? ""));
  const [saving, setSaving] = useState(false);

  const plan = plans.find((p) => p.key === planKey);
  const end = useMemo(() => (plan && start ? planEndDate(start, plan) : ""), [plan, start]);
  const installments = getInstallments(plan);

  const changePlan = (key) => {
    setPlanKey(key);
    setAmount(String(plans.find((p) => p.key === key)?.price_value ?? ""));
  };

  const handleSave = async () => {
    if (!plan) return toast.error("Escolha um plano.");
    if (!start) return toast.error("Informe a data de início.");
    const value = Number(String(amount).replace(",", "."));
    if (!String(amount).trim() || !Number.isFinite(value) || value < 0) return toast.error("Informe um valor válido.");
    setSaving(true);
    try {
      const [fresh] = await base44.entities.User.filter({ email: student.email }, "-created_date", 1);
      if (!fresh) throw new Error("Aluna não encontrada");
      const cleanData = Object.fromEntries(Object.entries(fresh.data || {}).filter(([k]) => k !== "data"));
      const credits = plan.credits ?? 0;
      await base44.entities.PaymentHistory.create({
        user_id: fresh.id,
        user_email: student.email,
        user_name: student.full_name || student.email,
        plan_name: plan.key,
        amount: plan.price_value ?? value,
        payment_date: start,
        payment_method: method,
        notes: plan.key === student.plan ? "Renovação" : "Novo plano",
      });
      await base44.entities.User.update(fresh.id, {
        is_active: true,
        plan_start_date: start,
        plan_end_date: end,
        data: {
          ...cleanData,
          plan: plan.key,
          credits,
          _reset_plan_credits: true,
          plan_start_date: start,
          plan_end_date: end,
          last_payment_date: start,
          plan_paused: false,
        },
      });
      if (installments > 1) {
        const { error } = await supabase.from("financial_forecast_entries").upsert({
          student_id: fresh.id, kind: "allocation", month: `${start.slice(0, 7)}-01`,
          amount_cents: Math.round(value * 100), installments, plan_key: plan.key,
        }, { onConflict: "student_id,kind,month" });
        if (error) toast.error("Plano renovado, mas o valor não entrou no controle mensal.");
      }
      try {
        await base44.entities.Notification.create({
          user_email: student.email,
          type: "credits_added",
          title: "Pagamento confirmado 💙",
          message: `Seu plano ${plan.label} foi renovado com ${credits} créditos, válido até ${formatSafe(end, "dd/MM/yyyy")}.`,
          link: "/perfil",
          read: false,
        });
      } catch { /* noop */ }
      try {
        await sendPlanRenewedEmail({ data: { studentId: fresh.id } });
      } catch (e) {
        console.error("E-mail de renovação não enviado", e);
        toast.error("Plano renovado, mas o e-mail não pôde ser enviado.");
      }
      ["allUsers", "paymentHistory", "myPaymentHistory", "financialForecastEntries", "userCredits", "myProfile"].forEach((k) =>
        queryClient.invalidateQueries({ queryKey: [k] }));
      toast.success(`Plano renovado! ${credits} créditos liberados.`);
      onClose();
    } catch (err) {
      toast.error("Erro ao renovar: " + (err?.message || ""));
    }
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-primary" /> Renovar / novo plano</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {student.full_name || student.email}
          {student.plan_end_date ? ` · ciclo atual até ${formatSafe(student.plan_end_date, "dd/MM/yyyy")}` : ""}
        </p>
        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1 block">Plano do novo ciclo</Label>
            <Select value={planKey} onValueChange={changePlan}>
              <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
              <SelectContent>
                {plans.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <Label className="text-xs mb-1 block">Início</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mobile-native-field w-full" />
            </div>
            <div className="min-w-0">
              <Label className="text-xs mb-1 block">Válido até</Label>
              <div className="h-9 flex items-center px-3 rounded-md border border-border bg-muted/30 text-sm">{end ? formatSafe(end, "dd/MM/yyyy") : "—"}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs mb-1 block">Forma de pagamento</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="cartao_credito">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">{installments > 1 ? "Total recebido (R$)" : "Valor (R$)"}</Label>
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Libera {plan?.credits ?? 0} créditos. A aluna vê o plano e o pagamento no perfil dela.
            {installments > 1 ? ` O total entra no controle mensal em ${installments} retiradas.` : ""}
          </p>
          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Confirmar renovação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
