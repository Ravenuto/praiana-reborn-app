import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, User, MoreHorizontal, Bookmark, CreditCard, Settings, Info, ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function BottomTabs() {
  const location = useLocation();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryTabs = [
    { path: "/aulas", label: "Agenda", icon: Calendar },
    { path: "/minhas-reservas", label: "Reservas", icon: Bookmark },
    { path: "/perfil", label: "Perfil", icon: User },
  ];

  const moreTabs = [
    { path: "/planos", label: "Planos", icon: CreditCard },
    { path: "/sobre", label: "Sobre", icon: Info },
    { path: "/configuracoes", label: "Configurações", icon: Settings },
    ...(user?.role === "admin" ? [{ path: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  const isActive = (path) => location.pathname === path;
  const isMoreActive = moreTabs.some((tab) => isActive(tab.path));

  return (
    <>
      <div className="md:hidden fixed bottom-3 inset-x-3 z-40 pb-[max(0rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-md flex items-center justify-between gap-1 px-2 py-2 rounded-full bg-background/90 backdrop-blur-xl ring-1 ring-primary/10 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.4)]">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-full transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.6)]"
                    : "text-foreground/60 hover:text-primary"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">{tab.label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setMoreOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-full transition-all ${
              isMoreActive
                ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.6)]"
                : "text-foreground/60 hover:text-primary"
            }`}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Mais</span>
          </button>
        </div>
      </div>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl border-t border-primary/10">
          <SheetHeader className="mb-4">
            <SheetTitle className="font-heading italic text-primary text-2xl">Mais opções</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 pb-6">
            {moreTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
                    isActive(tab.path)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-primary/5"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => { setMoreOpen(false); base44.auth.logout(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
