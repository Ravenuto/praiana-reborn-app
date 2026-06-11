import logoPraiana from "@/assets/logo-praiana.png";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SUB_TITLES = {
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
    <div
      className="md:hidden fixed top-0 inset-x-0 z-50 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2"
    >
      <div
        className={`mx-auto max-w-3xl flex items-center justify-between gap-2 rounded-[1.75rem] pl-2 pr-3 py-2 transition-all duration-500 ${
          scrolled
            ? "bg-background/85 backdrop-blur-xl ring-1 ring-primary/10 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.25)]"
            : "bg-background/50 backdrop-blur-md"
        }`}
      >
        {subTitle ? (
          <>
            <button
              onClick={() => navigate(-1)}
              aria-label="Voltar"
              className="h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center hover:bg-primary/15 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="font-heading italic text-primary text-lg truncate">
              {subTitle}
            </span>
            <Link
              to="/notificacoes"
              aria-label="Notificações"
              className="h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center hover:bg-primary/15 transition-colors"
            >
              <Bell className="h-4 w-4" />
            </Link>
          </>
        ) : (
          <>
            <Link to="/" className="flex items-center gap-2.5 group min-w-0">
              <span className="shrink-0 relative flex h-10 w-10 items-center justify-center rounded-full p-1 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 bg-white dark:bg-white shadow-sm ring-1 ring-primary/10">
                <img src={logoPraiana} alt="Praiana" className="h-full w-full object-contain" />
              </span>
              <span className="font-heading italic text-primary text-[15px] truncate">
                Praiana Pole Dance
              </span>
            </Link>
            <Link
              to="/notificacoes"
              aria-label="Notificações"
              className="h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center hover:bg-primary/15 transition-colors"
            >
              <Bell className="h-4 w-4" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
