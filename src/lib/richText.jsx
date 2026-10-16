import React from "react";

// Texto simples com **negrito**, *itálico* e __sublinhado__, preservando espaços e quebras.
export function RichText({ text, className = "" }) {
  const parts = String(text || "").split(/(\*\*[\s\S]+?\*\*|__[\s\S]+?__|\*[^*\n]+?\*)/g);
  return (
    <div className={`whitespace-pre-wrap break-words ${className}`}>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**") && p.length > 4)
          return <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>;
        if (p.startsWith("__") && p.endsWith("__") && p.length > 4)
          return <u key={i}>{p.slice(2, -2)}</u>;
        if (p.startsWith("*") && p.endsWith("*") && p.length > 2)
          return <em key={i}>{p.slice(1, -1)}</em>;
        return <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </div>
  );
}

/** Envolve a seleção do textarea com o marcador e devolve o novo texto. */
export function wrapSelection(textarea, marker, onChange) {
  if (!textarea) return;
  const { selectionStart: s, selectionEnd: e, value } = textarea;
  const sel = value.slice(s, e) || "texto";
  const next = value.slice(0, s) + marker + sel + marker + value.slice(e);
  onChange(next);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(s + marker.length, s + marker.length + sel.length);
  });
}
