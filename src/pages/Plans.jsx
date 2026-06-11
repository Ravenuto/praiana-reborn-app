import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PraianaBlobs from "@/components/shared/PraianaBlobs";
import SectionHeader from "@/components/shared/SectionHeader";
import useReveal from "@/hooks/useReveal";

const WHATSAPP_NUMBER = "5521999999999";

function getWhatsappLink(planLabel) {
  const msg = encodeURIComponent(`Oii, quero comprar o plano de ${planLabel} da Praiana`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

export default function Plans() {
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["studioPlans"],
    queryFn: () => base44.entities.StudioPlan.filter({ is_active: true }),
  });

  const sorted = [...plans].sort((a, b) => (a.price_value || 0) - (b.price_value || 0));
  useReveal([sorted.length]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <PraianaBlobs />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <SectionHeader
          eyebrow="Invista em você"
          title="Planos & Valores"
          goldWord="Valores"
          subtitle="Escolha o plano ideal e fale com a equipe pelo WhatsApp."
          align="center"
          className="mx-auto text-center"
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-72 rounded-3xl" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground surface-glass">
            <p className="text-sm">Nenhum plano disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sorted.map((plan, i) => (
              <article
                key={plan.id}
                style={{ animationDelay: `${i * 120}ms` }}
                className={`reveal relative rounded-3xl p-6 flex flex-col gap-4 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground ring-1 ring-primary/30 shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.6)]"
                    : "bg-card/85 ring-1 ring-primary/10 shadow-[0_20px_50px_-25px_hsl(var(--primary)/0.25)]"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-accent-foreground text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                      Mais popular
                    </span>
                  </div>
                )}
                <div>
                  <p className={`eyebrow ${plan.highlight ? "!text-primary-foreground/70" : ""}`}>{plan.label}</p>
                  <p className={`font-heading italic text-4xl mt-2 ${plan.highlight ? "text-accent" : "text-primary"}`}>{plan.price}</p>
                  <p className={`text-xs mt-1 ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.per_class}</p>
                </div>
                {plan.benefits?.length > 0 && (
                  <ul className="space-y-2 flex-1">
                    {plan.benefits.map((b, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${plan.highlight ? "text-primary-foreground/90" : ""}`}>
                        <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlight ? "text-accent" : "text-primary"}`} />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                <a href={getWhatsappLink(plan.label)} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full" variant={plan.highlight ? "gold" : "outline"}>
                    <MessageCircle className="h-4 w-4" /> Quero este plano
                  </Button>
                </a>
              </article>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-10">
          Para contratar ou renovar seu plano, entre em contato via WhatsApp. Será um prazer te atender!
        </p>
      </div>
    </div>
  );
}
