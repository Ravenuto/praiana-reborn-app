import { closureType } from "@/lib/studioClosures";

const br = d => d ? d.split("-").reverse().join("/") : "";

export default function ClosureNotice({ closure }) {
  const type = closureType(closure);
  const start = closure.start_date || closure.date;
  const end = closure.end_date || start;
  const isPeriod = start && end && end !== start;
  return (
    <div className="text-center py-12 px-4 border-y border-border bg-muted/30">
      <span className="text-4xl" aria-hidden="true">{type.emoji}</span>
      <h3 className="font-heading font-semibold text-primary text-lg mt-3">{type.label}</h3>
      {isPeriod && <span className="inline-block mt-3 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-xs font-semibold text-primary">Período: {br(start)} a {br(end)}</span>}
      <p className="text-sm text-foreground mt-2 whitespace-pre-wrap break-words">{closure.message?.trim() || type.message}</p>
    </div>
  );
}