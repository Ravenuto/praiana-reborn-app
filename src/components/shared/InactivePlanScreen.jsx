import React from "react";
import { Heart, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useSiteContent } from "@/lib/siteContent";

export default function InactivePlanScreen() {
  const content = useSiteContent();
  const whatsappUrl = content.content_home_whatsapp_url;
  const hasWhatsapp = /^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(whatsappUrl || "") && !/9999999999/.test(whatsappUrl);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Heart className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
            Studio Praiana Pole Dance
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Seu plano está inativo no momento. 💙
          </p>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Para reativar seu plano e voltar a acessar as aulas, entre em contato com o estúdio pelo WhatsApp.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {hasWhatsapp && (
            <Button asChild className="rounded-full gap-2">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Phone className="w-4 h-4" /> Falar pelo WhatsApp
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            className="text-muted-foreground text-sm"
            onClick={async () => {
              try { window.localStorage.setItem('raissa_logged_out', '1'); } catch {}
              await base44.auth.logout();
              window.location.assign('/login');
            }}
          >
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}