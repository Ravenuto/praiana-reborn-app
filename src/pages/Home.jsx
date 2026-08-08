import praianaLogo from "@/assets/praiana-logo.png.asset.json";
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Bookmark, Instagram } from "lucide-react";
import RaissaBlobs from "@/components/shared/RaissaBlobs";
import useReveal from "@/hooks/useReveal";
import { useAuth } from "@/lib/AuthContext";

// WhatsApp glyph (lucide doesn't ship one)
const WhatsApp = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .17 5.33.17 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.9 11.9 0 0 0 5.77 1.48h.01c6.57 0 11.9-5.33 11.9-11.9 0-3.18-1.24-6.17-3.46-8.45ZM12.08 21.3h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.74.98 1-3.65-.22-.37a9.39 9.39 0 0 1-1.43-4.95c0-5.18 4.22-9.4 9.4-9.4 2.51 0 4.87.98 6.64 2.76a9.32 9.32 0 0 1 2.76 6.64c0 5.18-4.22 9.5-9.27 9.5Zm5.43-7.06c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.66.15s-.76.96-.93 1.16c-.17.2-.34.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.91-2.18-.24-.58-.49-.5-.66-.51l-.56-.01a1.08 1.08 0 0 0-.78.37c-.27.3-1.03 1.01-1.03 2.46s1.05 2.86 1.2 3.06c.15.2 2.07 3.17 5.02 4.45.7.3 1.25.48 1.67.62.7.22 1.34.19 1.84.12.56-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z"/>
  </svg>
);

export default function Home() {
  const { user } = useAuth();
  useReveal();
  const firstName = (user?.full_name || "aluna").split(" ")[0];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <RaissaBlobs />

      <section className="relative px-5 pt-6 pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="grid gap-6 items-center animate-fade-up">
            {/* Floating logo badge */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-accent/30 blur-2xl animate-pulse-ring" />
                <div className="relative h-28 w-28 rounded-full bg-white backdrop-blur ring-2 ring-white/70 shadow-[0_18px_50px_-15px_hsl(var(--primary)/0.45)] overflow-hidden animate-float-y grid place-items-center">
                  <img src={praianaLogo.url} alt="Studio Praiana Pole Dance" className="h-full w-full object-contain scale-[1.12]" />
                </div>
              </div>
            </div>

            {/* Brand tagline moved to header */}

            {/* Greeting */}
            <div className="text-center">
              <span className="eyebrow inline-flex items-center gap-2 justify-center">
                <span className="h-px w-8 bg-accent" />
                Área da aluna
              </span>
              <h1 className="mt-3 font-heading text-5xl md:text-6xl leading-[1.1] text-primary text-balance">
                <span>Olá, <span className="gold-word">{firstName}</span>,</span>
                <br />
                <span className="italic">bem-vinda de volta.</span>
              </h1>
              <p className="mt-4 max-w-md mx-auto text-base text-muted-foreground leading-relaxed">
                Marque as suas aulas, gerencie seu plano e acompanhe as novidades do studio.
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
        </div>
      </section>

      {/* Socials */}
      <section className="relative px-5 pt-2 pb-8">
        <div className="max-w-md mx-auto flex items-center justify-center gap-4">
          <a
            href="https://instagram.com/raissa.poledance"
            target="_blank" rel="noopener noreferrer"
            aria-label="Instagram"
            className="h-14 w-14 rounded-full grid place-items-center text-white shadow-[0_12px_30px_-10px_rgba(225,48,108,0.6)] hover:-translate-y-0.5 transition-transform"
            style={{ background: "linear-gradient(135deg,#f9ce34 0%,#ee2a7b 50%,#6228d7 100%)" }}
          >
            <Instagram className="h-6 w-6" />
          </a>
          <a
            href="https://wa.me/5521999999999"
            target="_blank" rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="h-14 w-14 rounded-full grid place-items-center text-white shadow-[0_12px_30px_-10px_rgba(37,211,102,0.65)] hover:-translate-y-0.5 transition-transform"
            style={{ background: "#25D366" }}
          >
            <WhatsApp className="h-6 w-6" />
          </a>
        </div>
      </section>
    </div>
  );
}
