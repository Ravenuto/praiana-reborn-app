import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Loader2, RotateCcw, ImagePlus, X, ChevronDown, Eye } from "lucide-react";
import { CONTENT_GROUPS, CONTENT_DEFAULTS, clearContentCache } from "@/lib/siteContent";
import { getStudioSettings, DEFAULTS as SETTINGS_DEFAULTS } from "@/lib/studioSettings";
import { fillPlaceholders } from "@/lib/siteContent";
import praianaLogo from "@/assets/praiana-logo.png.asset.json";

/* ---------------- Prévia por bloco ---------------- */

function PreviewFrame({ children }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-1.5 mb-3 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Eye className="h-3.5 w-3.5" />
        Como a aluna vê
      </div>
      <div className="rounded-xl bg-background p-4">{children}</div>
    </div>
  );
}

function SectionPreview({ preview, v, numbers }) {
  const logo = v.content_home_logo || v.content_login_logo || praianaLogo.url;

  switch (preview) {
    case "home_header":
      return (
        <div className="text-center">
          <span className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">
            {v.content_home_eyebrow}
          </span>
          <h2 className="mt-2 font-heading text-2xl text-primary leading-tight">
            {v.content_home_greeting} <span className="text-accent">Maria</span>,
            <br />
            <span className="italic">{v.content_home_title_line2}</span>
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">{v.content_home_subtitle}</p>
        </div>
      );
    case "home_buttons":
      return (
        <div className="flex flex-wrap justify-center gap-2">
          <span className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            {v.content_home_cta_primary}
          </span>
          <span className="px-4 py-2 rounded-full bg-muted text-foreground text-xs font-medium">
            {v.content_home_cta_secondary}
          </span>
        </div>
      );
    case "links":
      return (
        <div className="space-y-1.5 text-xs">
          <p className="text-muted-foreground break-all">
            Instagram: <span className="text-primary">{v.content_home_instagram_url}</span>
          </p>
          <p className="text-muted-foreground break-all">
            WhatsApp: <span className="text-primary">{v.content_home_whatsapp_url}</span>
          </p>
        </div>
      );
    case "logo":
      return (
        <div className="flex justify-center">
          <span className="h-20 w-20 rounded-full bg-white ring-1 ring-primary/10 grid place-items-center overflow-hidden">
            <img src={logo} alt="Logo" className="h-full w-full object-contain scale-[1.12]" />
          </span>
        </div>
      );
    case "about_header":
      return (
        <div className="text-center">
          <span className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">
            {v.content_about_eyebrow}
          </span>
          <h2 className="mt-2 font-heading italic font-bold text-primary text-2xl leading-tight">
            {String(v.content_about_title || "")
              .split(v.content_about_gold_word || "\u0000")
              .flatMap((part, i, arr) => [
                <span key={`p${i}`}>{part}</span>,
                i < arr.length - 1 ? (
                  <span key={`g${i}`} className="text-accent">
                    {v.content_about_gold_word}
                  </span>
                ) : null,
              ])}
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">{v.content_about_subtitle}</p>
        </div>
      );
    case "about_contact":
      return (
        <div className="grid gap-2 sm:grid-cols-3 text-xs">
          {[
            [v.content_about_address_title, v.content_about_address],
            [v.content_about_phone_title, v.content_about_phone],
            [v.content_about_email_title, v.content_about_email],
          ].map(([t, val], i) => (
            <div key={i} className="rounded-lg border border-border p-2.5">
              <p className="font-semibold text-foreground">{t}</p>
              <p className="text-muted-foreground whitespace-pre-line break-words">{val}</p>
            </div>
          ))}
        </div>
      );
    case "about_modalities":
      return (
        <div className="text-center">
          <h3 className="font-heading text-lg font-bold">{v.content_about_modalities_title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {v.content_about_modalities_subtitle}
          </p>
        </div>
      );
    case "login_title":
      return (
        <h2 className="text-center font-heading italic text-primary text-xl leading-tight">
          {v.content_login_title_prefix}{" "}
          <span className="text-accent not-italic font-semibold">
            {v.content_login_title_highlight}
          </span>{" "}
          {v.content_login_title_suffix}
        </h2>
      );
    case "login_texts":
      return (
        <div className="text-center space-y-2">
          <p className="font-script text-base text-primary">{v.content_login_script}</p>
          <p className="text-xs text-muted-foreground">{v.content_login_subtitle}</p>
          <span className="inline-block px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            {v.content_login_submit} →
          </span>
        </div>
      );
    case "login_footer":
      return (
        <p className="text-center text-xs text-muted-foreground">
          {v.content_login_signup_text}{" "}
          <span className="text-primary font-medium underline">
            {v.content_login_signup_link_label}
          </span>
          <span className="block text-[10px] text-muted-foreground mt-1 break-all">
            Link: {v.content_home_whatsapp_url}
          </span>
        </p>
      );
    case "rules_header":
      return <h3 className="font-heading text-lg font-semibold">{v.content_rules_title}</h3>;
    case "rules_block":
      return (
        <div className="space-y-2 text-xs">
          {[
            [
              v.content_rules_booking_title,
              [v.content_rules_booking_text, v.content_rules_cancel_text],
            ],
            [v.content_rules_late_title, [v.content_rules_late_text]],
            [v.content_rules_credits_title, [v.content_rules_credits_text]],
            [v.content_rules_waitlist_title, [v.content_rules_waitlist_text]],
            [v.content_rules_holidays_title, [v.content_rules_holidays_text]],
          ].map(([title, texts], i) => (
            <div key={i} className="rounded-lg bg-muted/50 p-2.5">
              <p className="font-medium text-foreground">{title}</p>
              {texts.map((t, j) => (
                <p key={j} className="text-muted-foreground">
                  {fillPlaceholders(t, numbers)}
                </p>
              ))}
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

/* ---------------- Editor ---------------- */

export default function ManageSiteContent() {
  const [group, setGroup] = useState(CONTENT_GROUPS[0].id);
  const [openSection, setOpenSection] = useState(CONTENT_GROUPS[0].sections[0].id);
  const [values, setValues] = useState({ ...CONTENT_DEFAULTS });
  const [saved, setSaved] = useState({ ...CONTENT_DEFAULTS });
  const [rows, setRows] = useState([]);
  const [numbers, setNumbers] = useState({
    bookingHours: SETTINGS_DEFAULTS.booking_min_hours,
    cancelHours: SETTINGS_DEFAULTS.cancel_min_hours,
    lateMinutes: SETTINGS_DEFAULTS.late_tolerance_minutes,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const list = await base44.entities.StudioSettings.list();
    setRows(list);
    const map = { ...CONTENT_DEFAULTS };
    list.forEach((r) => {
      if (r.key in CONTENT_DEFAULTS && r.value) map[r.key] = r.value;
    });
    setValues(map);
    setSaved(map);
    const s = await getStudioSettings({ fresh: true });
    setNumbers({
      bookingHours: s.booking_min_hours,
      cancelHours: s.cancel_min_hours,
      lateMinutes: s.late_tolerance_minutes,
    });
    setLoading(false);
  };

  const current = CONTENT_GROUPS.find((g) => g.id === group);
  const activeSection = current.sections.find((s) => s.id === openSection) || current.sections[0];

  const dirtyKeys = useMemo(
    () => Object.keys(CONTENT_DEFAULTS).filter((k) => (values[k] ?? "") !== (saved[k] ?? "")),
    [values, saved],
  );

  const setField = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  const persist = async (key, value) => {
    const existing = rows.find((r) => r.key === key);
    if (existing)
      await base44.entities.StudioSettings.update(existing.id, { value: String(value ?? "") });
    else await base44.entities.StudioSettings.create({ key, value: String(value ?? "") });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const key of dirtyKeys) await persist(key, values[key]);
      clearContentCache();
      await load();
      toast.success("Alterações salvas!");
    } catch {
      toast.error("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetSection = async () => {
    setSaving(true);
    try {
      for (const field of activeSection.fields) await persist(field.key, field.default);
      clearContentCache();
      await load();
      toast.success(`"${activeSection.label}" voltou ao texto padrão.`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (key, file) => {
    if (!file) return;
    setUploading(key);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setField(key, file_url || "");
      toast.success("Imagem carregada. Clique em Salvar para aplicar.");
    } catch {
      toast.error("Falha ao enviar a imagem.");
    } finally {
      setUploading("");
    }
  };

  const changeGroup = (id) => {
    setGroup(id);
    const g = CONTENT_GROUPS.find((x) => x.id === id);
    setOpenSection(g.sections[0].id);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h3 className="font-heading text-base font-semibold mb-1">Textos e imagens do site</h3>
        <p className="text-xs text-muted-foreground">
          Escolha a página, abra o bloco que quer mudar e veja a prévia ao lado enquanto digita.
        </p>
      </div>

      {/* Páginas */}
      <div className="flex flex-wrap gap-1.5">
        {CONTENT_GROUPS.map((g) => (
          <button
            key={g.id}
            onClick={() => changeGroup(g.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
              group === g.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {current.description && (
        <p className="text-xs text-muted-foreground -mt-2">{current.description}</p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] items-start">
        {/* Blocos */}
        <div className="space-y-2 min-w-0">
          {current.sections.map((section) => {
            const open = section.id === activeSection.id;
            const sectionDirty = section.fields.some((f) => dirtyKeys.includes(f.key));
            return (
              <div
                key={section.id}
                className={`rounded-2xl border transition-colors ${
                  open ? "border-primary/40 bg-card" : "border-border bg-card/60"
                }`}
              >
                <button
                  onClick={() => setOpenSection(open ? "" : section.id)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left"
                >
                  <span className="flex-1 min-w-0">
                    <span className="text-sm font-medium flex items-center gap-2">
                      {section.label}
                      {sectionDirty && (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                      )}
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">
                      {section.hint}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>

                {open && (
                  <div className="px-4 pb-4 space-y-4">
                    {section.fields.map((field) => (
                      <div key={field.key} className="min-w-0">
                        <label className="text-sm font-medium block">{field.label}</label>
                        {field.help && (
                          <p className="text-[11px] text-muted-foreground mb-1.5">{field.help}</p>
                        )}
                        {!field.help && <div className="mb-1.5" />}

                        {field.type === "image" ? (
                          <div className="flex items-center gap-3">
                            {values[field.key] ? (
                              <div className="relative">
                                <img
                                  src={values[field.key]}
                                  alt={field.label}
                                  className="h-16 w-16 rounded-xl object-contain bg-white ring-1 ring-border"
                                />
                                <button
                                  type="button"
                                  onClick={() => setField(field.key, "")}
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center"
                                  aria-label="Remover imagem"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="h-16 w-16 rounded-xl bg-muted grid place-items-center text-muted-foreground">
                                <ImagePlus className="h-5 w-5" />
                              </div>
                            )}
                            <label className="text-xs cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80">
                              {uploading === field.key ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ImagePlus className="h-3.5 w-3.5" />
                              )}
                              Escolher imagem
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleUpload(field.key, e.target.files?.[0])}
                              />
                            </label>
                          </div>
                        ) : field.type === "textarea" ? (
                          <Textarea
                            rows={3}
                            value={values[field.key] ?? ""}
                            onChange={(e) => setField(field.key, e.target.value)}
                            className="w-full min-w-0 text-sm"
                          />
                        ) : (
                          <Input
                            value={values[field.key] ?? ""}
                            onChange={(e) => setField(field.key, e.target.value)}
                            className="w-full min-w-0 text-sm"
                          />
                        )}
                      </div>
                    ))}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetSection}
                      disabled={saving}
                      className="gap-2 text-xs text-muted-foreground"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restaurar textos deste bloco
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Prévia */}
        <div className="lg:sticky lg:top-4 min-w-0">
          <PreviewFrame>
            <SectionPreview preview={activeSection.preview} v={values} numbers={numbers} />
          </PreviewFrame>
        </div>
      </div>

      {/* Barra de salvar */}
      <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-background/90 backdrop-blur border-t border-border sm:border-0 flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving || dirtyKeys.length === 0} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar alterações
        </Button>
        <span className="text-xs text-muted-foreground">
          {dirtyKeys.length === 0
            ? "Tudo salvo"
            : `${dirtyKeys.length} alteração${dirtyKeys.length > 1 ? "ões" : ""} pendente${dirtyKeys.length > 1 ? "s" : ""}`}
        </span>
      </div>
    </div>
  );
}
