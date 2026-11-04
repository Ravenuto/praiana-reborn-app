import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { splitNotes } from "@/lib/sessionNotes";

export default function NotesListEditor({ value, onChange, placeholder, className = "" }) {
  const [draft, setDraft] = useState("");
  const items = splitNotes(value);
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...items, t].join("\n"));
    setDraft("");
  };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i).join("\n"));
  return (
    <div className={`space-y-2 ${className}`}>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((n, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs">
              {n}
              <button type="button" aria-label={`Remover ${n}`} onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="h-9 text-sm"
        />
        <Button type="button" size="icon" variant="outline" onClick={add} aria-label="Adicionar observação">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
