import praianaLogo from "@/assets/praiana-logo.png.asset.json";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useUnreadCount } from "@/hooks/useNotifications";

const SUB_TITLES = {
  "/aulas": "Agenda",
  "/minhas-reservas": "Minhas reservas",
  "/perfil": "Perfil",
  "/configuracoes": "Configurações",
  "/sobre": "Sobre",
  "/admin": "Admin",
  "/planos": "Planos",
  "/notificacoes": "Notificações",
};

function titleFor(pathname) {
  const key = Object.keys(SUB_TITLES).find((k) => pathname.startsWith(k));
  return key ? SUB_TITLES[key] : null;
}

function BellLink() {
  const { user } = useAuth();
  const count = useUnreadCount(user?.email);
  return (
    <Link
      to="/notificacoes"
      aria-label="Notificações"
      className="relative h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center hover:bg-primary/15 transition-colors"
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-[10px] font-bold text-accent-foreground grid place-items-center ring-2 ring-background animate-pulse">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

export default function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const subTitle = titleFor(location.pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="md:hidden fixed top-0 inset-x-0 z-50 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
      <div
        className={`mx-auto max-w-3xl flex items-center justify-between gap-2 rounded-[1.75rem] pl-2 pr-3 py-2 transition-all duration-500 ${
          scrolled
            ? "bg-background/85 backdrop-blur-xl ring-1 ring-primary/10 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.25)]"
            : "bg-background/50 backdrop-blur-md"
        }`}
      >
        {subTitle ? (
          <>
            <Link to="/" className="flex items-center gap-2 group shrink-0" aria-label="Ir para Home">
              <span className="shrink-0 relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 bg-white dark:bg-white shadow-sm ring-1 ring-primary/10">
                <img src={praianaLogo.url} alt="Praiana Pole Dance Studio" className="h-full w-full object-contain scale-[1.15]" />

              </span>
            </Link>
            <span className="flex-1 text-center font-heading italic text-primary font-semibold text-lg truncate">
              {subTitle}
            </span>
            <BellLink />
          </>
        ) : (
          <>
            <Link to="/" className="flex items-center gap-2 group shrink-0" aria-label="Praiana Pole Dance Studio">
              <span className="shrink-0 relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 bg-white dark:bg-white shadow-sm ring-1 ring-primary/10">
                <img src={praianaLogo.url} alt="Praiana Pole Dance Studio" className="h-full w-full object-contain scale-[1.15]" />
              </span>
            </Link>
            <span className="flex-1 text-center font-heading italic text-primary font-semibold text-base sm:text-lg leading-tight truncate px-1">
              <span className="text-accent not-italic font-semibold">Praiana</span> Pole Dance Studio
            </span>

            <BellLink />
          </>
        )}
      </div>
    </div>
  );
}

