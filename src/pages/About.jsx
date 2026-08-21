import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Mail } from "lucide-react";
import { motion } from "framer-motion";
import StudioRules from "@/components/settings/StudioRules";
import SectionHeader from "@/components/shared/SectionHeader";
import { useSiteContent } from "@/lib/siteContent";

export default function About() {
  const c = useSiteContent();
  const { data: classTypes = [] } = useQuery({
    queryKey: ["classTypes"],
    queryFn: async () => {
      const list = await base44.entities.ClassType.filter({ is_active: true });
      return list.filter((ct) => ct.show_in_app !== false);
    }
  });


  return (
    <div className="font-body">
      {/* Header */}
      <section className="relative overflow-hidden py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeader
            eyebrow={c.content_about_eyebrow}
            title={c.content_about_title}
            goldWord={c.content_about_gold_word}
            subtitle={c.content_about_subtitle}
            align="center"
            className="mx-auto text-center"
            titleClassName="!text-2xl sm:!text-3xl md:!text-5xl"
          />

          {/* Contact Info Grid */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm mb-1">{c.content_about_address_title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                    {c.content_about_address}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm mb-1">{c.content_about_phone_title}</h3>
                  <a href={`tel:${c.content_about_phone.replace(/\D/g, "")}`} className="text-xs text-primary hover:text-primary/80">
                    {c.content_about_phone}
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm mb-1">{c.content_about_email_title}</h3>
                  <a href={`mailto:${c.content_about_email}`} className="text-xs text-primary hover:text-primary/80 break-all">
                    {c.content_about_email}
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Modalidades */}
      {classTypes.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold">{c.content_about_modalities_title}</h2>
            <p className="mt-3 text-muted-foreground">{c.content_about_modalities_subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classTypes.map((ct, i) =>
              <motion.div
                key={ct.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="rounded-xl overflow-hidden border border-border bg-card hover:shadow-lg transition-shadow">
                  {ct.image_url ? (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={ct.image_url}
                        alt={ct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="aspect-[4/3] flex items-center justify-center"
                      style={{ backgroundColor: ct.color || "hsl(320, 45%, 45%)", opacity: 0.15 }}
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-heading text-lg font-semibold">{ct.name}</h3>
                    {ct.description && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                        {ct.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* Regras */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-12">
        <StudioRules />
      </section>
    </div>
  );
}