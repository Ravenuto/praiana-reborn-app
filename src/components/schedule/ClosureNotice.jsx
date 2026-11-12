import { closureType } from "@/lib/studioClosures";

export default function ClosureNotice({ closure }) {
  const type = closureType(closure);
  return (
    <div className="text-center py-12 px-4 border-y border-border bg-muted/30">
      <span className="text-4xl" aria-hidden="true">{type.emoji}</span>
      <h3 className="font-heading font-semibold text-primary text-lg mt-3">{type.label}</h3>
      <p className="text-sm text-foreground mt-2 whitespace-pre-wrap break-words">{closure.message?.trim() || type.message}</p>
    </div>
  );
}