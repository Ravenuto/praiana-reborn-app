import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { LEVELS, currentMonth, levelInfo, monthLabel, planProgress, recentMonths, skillInfo } from "@/lib/moves";

const MONTHS = recentMonths(12);

export default function MyMoves({ email }) {
  const [month, setMonth] = useState(currentMonth());

  const { data: plan, isLoading } = useQuery({
    queryKey: ["myMovePlan", email, month],
    queryFn: async () => {
      const rows = await base44.entities.StudentMovePlan.filter({ student_email: email, month });
      return rows?.[0] || null;
    },
    enabled: !!email,
  });

  const items = plan?.items || [];
  const progress = planProgress(items);
  const categories = [...new Set(items.map((it) => it.category || "Outros"))];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Meus movimentos
          </h2>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="mobile-native-field h-9 min-w-0 max-w-[170px] rounded-md border border-input bg-background px-2 text-xs"
          >
            {MONTHS.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sua professora ainda não montou os movimentos deste mês. 💙
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso do mês</span>
              <span>{progress.done}/{progress.total} dominados</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress.pct}%` }} />
            </div>
            {plan?.notes && (
              <div className="mt-4 rounded-xl bg-muted/40 border border-border p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Recado da professora</p>
                <p className="text-sm whitespace-pre-line">{plan.notes}</p>
              </div>
            )}
          </>
        )}
      </div>

      {categories.map((cat) => (
        <div key={cat} className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">{cat}</p>
          <div className="space-y-3">
            {items.filter((it) => (it.category || "Outros") === cat).map((it) => (
              <div key={it.move_id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <p className="font-medium text-sm">{it.name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${skillInfo(it.skill_level).badge}`}>
                    {skillInfo(it.skill_level).short}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {it.bilateral === false ? (
                    <LevelBadge label="Nível" level={it.left_level} />
                  ) : (
                    <>
                      <LevelBadge label="Esquerdo" level={it.left_level} />
                      <LevelBadge label="Direito" level={it.right_level} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {items.length > 0 && (
        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground px-1">
          {LEVELS.map((l) => (
            <span key={l.key} className="flex items-center gap-1.5">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${l.key === "dominado" ? "bg-primary" : l.key === "em_progresso" ? "bg-accent" : "bg-muted-foreground/40"}`} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function LevelBadge({ label, level }) {
  const info = levelInfo(level);
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${info.badge}`}>
      {label}: {info.label}
    </span>
  );
}
