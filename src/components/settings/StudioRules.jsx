import React, { useState, useEffect } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { getStudioSettings } from "@/lib/studioSettings";
import { useSiteContent, fillPlaceholders } from "@/lib/siteContent";

export default function StudioRules() {
  const c = useSiteContent();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getStudioSettings({ fresh: true }).then(setSettings);
  }, []);

  if (!settings)
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );

  const numbers = {
    bookingHours: settings.booking_min_hours || "4",
    cancelHours: settings.cancel_min_hours || "4",
    lateMinutes: settings.late_tolerance_minutes || "15",
  };

  const fill = (t) => fillPlaceholders(t, numbers);

  const blocks = [
    {
      title: c.content_rules_booking_title,
      items: [fill(c.content_rules_booking_text), fill(c.content_rules_cancel_text)],
    },
    { title: c.content_rules_late_title, items: [fill(c.content_rules_late_text)] },
    { title: c.content_rules_credits_title, items: [fill(c.content_rules_credits_text)] },
    { title: c.content_rules_waitlist_title, items: [fill(c.content_rules_waitlist_text)] },
    { title: c.content_rules_holidays_title, items: [fill(c.content_rules_holidays_text)] },
  ].filter((b) => b.items.some((t) => String(t || "").trim()));

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-lg font-semibold">{c.content_rules_title}</h2>
      </div>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        {blocks.map((block, i) => (
          <div key={i} className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="font-medium text-foreground">{block.title}</p>
            {block.items.length > 1 ? (
              <ul className="space-y-1.5 list-disc list-inside">
                {block.items.map((t, j) => (
                  <li key={j}>{t}</li>
                ))}
              </ul>
            ) : (
              <p>{block.items[0]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
