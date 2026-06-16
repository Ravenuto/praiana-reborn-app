import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Heart } from "lucide-react";
import { getCredits, getPlan } from "@/utils";

const FALLBACK_LABELS = {
  "4_aulas": "4 aulas/mês",
  "8_aulas": "8 aulas/mês",
  "12_aulas": "12 aulas/mês",
  "avulsa": "Aula avulsa",
};

function humanizePlanKey(key) {
  if (!key) return "Plano de aulas";
  if (FALLBACK_LABELS[key]) return FALLBACK_LABELS[key];
  return String(key).replace(/_/g, " ");
}

export default function CreditBanner() {
  const { user } = useAuth();

  const { data: userData } = useQuery({
    queryKey: ["userCredits", user?.email],
    queryFn: async () => {
      const [u] = await base44.entities.User.filter({ email: user?.email }, "-created_date", 1);
      return u || null;
    },
    enabled: !!user?.email,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["studioPlans"],
    queryFn: () => base44.entities.StudioPlan.list(),
  });

  if (!user || user.role === "admin") return null;

  const credits = getCredits(userData);
  const planKey = getPlan(userData);
  const planLabel = plans.find((p) => p.key === planKey)?.label || humanizePlanKey(planKey);
  const noCredits = credits <= 0;

  return (
    <div className="rounded-2xl border-2 p-4 mb-6 bg-primary/5 border-primary/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary fill-primary" />
          <span className="text-sm font-semibold">{planLabel}</span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-heading leading-none text-primary">
            {credits}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {credits === 1 ? "crédito restante" : "créditos restantes"}
          </p>
        </div>
      </div>
    </div>
  );
}