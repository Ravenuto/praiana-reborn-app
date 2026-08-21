import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Loader2, RotateCcw, ImagePlus, X } from "lucide-react";
import { CONTENT_GROUPS, CONTENT_DEFAULTS, clearContentCache } from "@/lib/siteContent";

export default function ManageSiteContent() {
  const [group, setGroup] = useState(CONTENT_GROUPS[0].id);
  const [values, setValues] = useState({ ...CONTENT_DEFAULTS });
  const [rows, setRows] = useState([]);
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
    setLoading(false);
  };

  const current = CONTENT_GROUPS.find((g) => g.id === group);

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
      for (const field of current.fields) {
        await persist(field.key, values[field.key]);
      }
      clearContentCache();
      await load();
      toast.success(`Textos da página ${current.label} salvos!`);
    } catch {
      toast.error("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      for (const field of current.fields) {
        await persist(field.key, field.default);
      }
      clearContentCache();
      await load();
      toast.success("Textos restaurados para o padrão.");
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-heading text-base font-semibold mb-1">Textos e imagens do site</h3>
        <p className="text-xs text-muted-foreground">
          Edite o conteúdo das páginas públicas. As mudanças aparecem no app assim que você salva.
        </p>
      </div>

      {/* Sub-abas */}
      <div className="flex flex-wrap gap-1.5">
        {CONTENT_GROUPS.map((g) => (
          <button
            key={g.id}
            onClick={() => setGroup(g.id)}
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

      <div className="space-y-4 max-w-xl">
        {current.fields.map((field) => (
          <div key={field.key} className="min-w-0">
            <label className="text-sm font-medium block mb-1.5">{field.label}</label>

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
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar {current.label}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={saving} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Restaurar padrão
        </Button>
      </div>
    </div>
  );
}
