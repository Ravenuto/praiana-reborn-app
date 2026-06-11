import logoPraiana from "@/assets/logo-praiana.png";
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Bookmark, Instagram, MessageCircle } from "lucide-react";
import PraianaBlobs from "@/components/shared/PraianaBlobs";
import Marquee from "@/components/shared/Marquee";
import useReveal from "@/hooks/useReveal";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const { user } = useAuth();
  useReveal();
  const firstName = (user?.full_name || "aluna").split(" ")[0];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <PraianaBlobs />

      <section className="relative px-5 pt-6 pb-10">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="grid gap-6 items-center animate-fade-up">
            {/* Floating logo badge */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-accent/30 blur-2xl animate-pulse-ring" />
                <div className="relative h-28 w-28 rounded-full bg-background/90 dark:bg-white backdrop-blur ring-2 ring-white/70 shadow-[0_18px_50px_-15px_hsl(var(--primary)/0.45)] grid place-items-center p-3 animate-float-y">
                  <img src={logoPraiana} alt="Praiana Pole Dance" className="h-full w-full object-contain" />
                </div>
              </div>
            </div>

            {/* Eyebrow */}
            <div className="text-center">
              <span className="eyebrow inline-flex items-center gap-2 justify-center">
                <span className="h-px w-8 bg-accent" />
                Área da aluna
              </span>
              <h1 className="mt-3 font-heading text-4xl md:text-5xl leading-[1.05] text-primary text-balance">
                Olá, <span className="gold-word">{firstName}</span>
                <br className="hidden sm:block" />
                <span className="italic">bem-vinda de volta.</span>
              </h1>
              <p className="mt-4 max-w-md mx-auto text-base text-muted-foreground leading-relaxed">
                Veja sua agenda, gerencie reservas e acompanhe os recados do studio.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              <Button asChild size="lg">
                <Link to="/aulas">
                  <Calendar className="h-4 w-4" /> Agendar aula
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/minhas-reservas">
                  <Bookmark className="h-4 w-4" /> Minhas reservas
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick links cards */}
          <div className="mt-12 grid sm:grid-cols-3 gap-4">
            {[
              { to: "/feed", title: "Feed", desc: "Veja o que está rolando" },
              { to: "/recados", title: "Recados", desc: "Avisos da equipe" },
              { to: "/planos", title: "Planos", desc: "Renovar ou trocar" },
            ].map((card, i) => (
              <Link
                key={card.to}
                to={card.to}
                style={{ animationDelay: `${i * 120}ms` }}
                className="reveal group surface-glass p-5 lift-on-hover block"
              >
                <h3 className="font-heading italic text-primary text-2xl leading-tight">{card.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{card.desc}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent-foreground/80">
                  Acessar
                  <span className="transition-transform duration-300 group-hover:translate-x-1 text-accent">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <Marquee />

      {/* Socials */}
      <section className="relative px-5 py-10">
        <div className="max-w-md mx-auto text-center">
          <span className="eyebrow">Conecte-se</span>
          <h3 className="mt-3 font-heading italic text-primary text-3xl">Praiana nas redes</h3>
          <div className="mt-6 flex items-center justify-center gap-4">
            <a
              href="https://instagram.com/praianapoledance"
              target="_blank" rel="noopener noreferrer"
              className="h-12 w-12 rounded-full bg-primary/10 text-primary grid place-items-center hover:bg-primary hover:text-primary-foreground transition-all hover:-translate-y-0.5"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://wa.me/5521999999999"
              target="_blank" rel="noopener noreferrer"
              className="h-12 w-12 rounded-full bg-accent/15 text-accent-foreground grid place-items-center hover:bg-accent hover:text-accent-foreground transition-all hover:-translate-y-0.5"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
