import React from "react";

const DEFAULT_WORDS = ["Força", "Liberdade", "Empoderamento", "Flexibilidade", "Dança", "Arte", "Comunidade", "Movimento"];

export default function Marquee({ words = DEFAULT_WORDS, className = "" }) {
  return (
    <div className={`relative overflow-hidden border-y border-primary/10 py-5 bg-gradient-to-r from-background via-primary/5 to-background ${className}`} aria-hidden>
      <div className="flex whitespace-nowrap animate-marquee w-max will-change-transform">
        {Array.from({ length: 2 }).map((_, k) => (
          <div key={k} className="flex items-center shrink-0">
            {words.map((w, i) => (
              <span key={i} className="flex items-center">
                <span className="font-heading italic text-3xl leading-none text-primary/80 px-6">{w}</span>
                <span className="text-accent text-2xl leading-none">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
