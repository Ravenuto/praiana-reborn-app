import React from "react";
import useReveal from "@/hooks/useReveal";

/**
 * Praiana section header — eyebrow + italic ocean title with optional gold word + subtitle.
 * Usage: <SectionHeader eyebrow="Sua semana" title="Aulas" goldWord="Aulas" subtitle="Reserve seu horário" />
 *
 * If `title` contains the `goldWord` substring, that word is highlighted in gold.
 */
export default function SectionHeader({ eyebrow, title, goldWord, subtitle, align = "left", className = "" }) {
  useReveal([title, eyebrow]);
  const alignCls = align === "center" ? "text-center mx-auto" : "";

  const renderTitle = () => {
    if (!goldWord || !title?.includes(goldWord)) {
      return <span>{title}</span>;
    }
    const [before, after] = title.split(goldWord);
    return (
      <>
        {before}
        <span className="gold-word">{goldWord}</span>
        {after}
      </>
    );
  };

  return (
    <div className={`reveal max-w-2xl mb-6 ${alignCls} ${className}`}>
      {eyebrow && (
        <span className={`eyebrow inline-flex items-center gap-2 ${align === "center" ? "justify-center" : ""}`}>
          <span className="h-px w-8 bg-accent" />
          {eyebrow}
        </span>
      )}
      {title && (
        <h1 className="mt-3 font-heading italic text-primary text-4xl md:text-5xl leading-[1.05] tracking-tight">
          {renderTitle()}
        </h1>
      )}
      {subtitle && (
        <p className="mt-3 text-muted-foreground text-base leading-relaxed max-w-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}
