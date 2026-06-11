import logoPraiana from "@/assets/logo-praiana.png";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { useUnreadCount } from "@/hooks/useNotifications";
import {
  LogOut, Calendar, Bookmark, CreditCard, User, ShieldCheck, Settings, Info, Bell,
} from "lucide-react";

const PRIMARY_TABS = [
  { path: "/aulas", label: "Agenda", icon: Calendar },
  { path: "/minhas-reservas", label: "Reservas", icon: Bookmark },
  { path: "/planos", label: "Planos", icon: CreditCard },
  { path: "/perfil", label: "Perfil", icon: User },
];

const SECONDARY = [
  { path: "/sobre", label: "Sobre", icon: Info },
  { path: "/configuracoes", label: "Config", icon: Settings },
];

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const unreadCount = useUnreadCount(user?.email);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <nav className="fixed top-0 inset-x-0 z-50 px-4 py-3">
      <div
        className={`mx-auto max-w-6xl flex items-center justify-between gap-4 rounded-[1.75rem] pl-3 pr-3 py-2 transition-all duration-500 ${
          scrolled
            ? "bg-background/85 backdrop-blur-xl ring-1 ring-primary/10 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.3)]"
            : "bg-background/50 backdrop-blur-md"
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <span className="shrink-0 relative flex h-11 w-11 items-center justify-center rounded-full p-1 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 bg-white shadow-sm ring-1 ring-primary/10">
            <img src={logoPraiana} alt="Praiana" className="h-full w-full object-contain" />
          </span>
          <span className="font-heading italic text-primary text-lg whitespace-nowrap">
            Praiana Pole Dance
          </span>
        </Link>

        {/* Tabs */}
        <div className="flex items-center gap-1 text-sm">
          {PRIMARY_TABS.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={`relative px-3 py-2 rounded-full transition-colors ${
                isActive(tab.path)
                  ? "text-primary-foreground bg-primary shadow-sm"
                  : "text-foreground/70 hover:text-primary hover:bg-primary/5"
              }`}
            >
              {tab.label}
            </Link>
          ))}
          {SECONDARY.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={`px-3 py-2 rounded-full transition-colors ${
                isActive(tab.path)
                  ? "text-primary-foreground bg-primary shadow-sm"
                  : "text-foreground/70 hover:text-primary hover:bg-primary/5"
              }`}
            >
              {tab.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors ${
                isActive("/admin")
                  ? "text-accent-foreground bg-accent shadow-sm"
                  : "text-foreground/70 hover:text-accent-foreground hover:bg-accent/15"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/notificacoes"
            aria-label="Notificações"
            className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center hover:bg-primary/15 transition-colors"
          >
            <Bell className="h-4 w-4" />
          </Link>
          <button
            onClick={() => base44.auth.logout()}
            aria-label="Sair"
            className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center hover:bg-primary/15 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
