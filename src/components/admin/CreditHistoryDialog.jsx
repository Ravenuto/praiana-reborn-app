import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CreditHistoryDialog({ student, onClose }) {
  const studentId = student?.id;
  const { data, isLoading } = useQuery({
    queryKey: ["creditLedger", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("credit_ledger")
        .select("id, old_credits, new_credits, actor_id, created_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))];
      let names = {};
      if (actorIds.length) {
        const { data: people } = await supabase.from("profiles").select("id, full_name, email").in("id", actorIds);
        names = Object.fromEntries((people || []).map((p) => [p.id, p.full_name || p.email]));
      }
      return rows.map((r) => ({ ...r, actor: r.actor_id === studentId ? "pela aluna" : r.actor_id ? `por ${names[r.actor_id] || "equipe"}` : "automático" }));
    },
  });

  return (
    <Dialog open={!!student} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>HISTÓRICO DE CRÉDITOS</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">{student?.full_name}</p>
        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          {!isLoading && !data?.length && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma movimentação registrada ainda.</p>
          )}
          {data?.map((r) => {
            const diff = (r.new_credits ?? 0) - (r.old_credits ?? 0);
            return (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {r.old_credits ?? 0} → {r.new_credits ?? 0} créditos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(r.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} · {r.actor}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${diff >= 0 ? "text-primary" : "text-destructive"}`}>
                  {diff > 0 ? `+${diff}` : diff}
                </span>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
