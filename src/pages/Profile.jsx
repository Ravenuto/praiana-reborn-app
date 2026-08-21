import React, { useState, useRef, useEffect } from "react";
import { formatSafe } from "@/lib/dates";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Loader2, Save, CalendarDays, Phone, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getCredits } from "@/utils";
import { useRoles } from "@/lib/roles";
import MyPaymentHistory from "@/components/profile/MyPaymentHistory";
import SectionHeader from "@/components/shared/SectionHeader";

const planInfo = {
  "4_aulas": { label: "4 aulas/mês", price: "R$ 230", color: "bg-blue-100 text-blue-700" },
  "8_aulas": { label: "8 aulas/mês", price: "R$ 370", color: "bg-purple-100 text-purple-700" },
  "12_aulas": { label: "12 aulas/mês", price: "R$ 480", color: "bg-pink-100 text-pink-700" },
  "avulsa": { label: "Aula avulsa", price: "R$ 70", color: "bg-amber-100 text-amber-700" },
};

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [form, setForm] = useState(null);

  // Busca dados completos do User entity (inclui créditos atualizados pelo admin)
  const { data: userEntity, isLoading: loadingEntity } = useQuery({
    queryKey: ["userCredits", user?.email],
    queryFn: async () => {
      const [u] = await base44.entities.User.filter({ email: user?.email }, "-created_date", 1);
      return u || null;
    },
    enabled: !!user?.email,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: userData, isLoading } = useQuery({
    queryKey: ["myProfile"],
    queryFn: () => base44.auth.me(),
    enabled: !!user,
  });

  const { data: studioPlans = [] } = useQuery({
    queryKey: ["studioPlans"],
    queryFn: () => base44.entities.StudioPlan.list(),
  });

  const today = new Date();
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");

  const { data: monthBookings = [] } = useQuery({
    queryKey: ["profileBookings", user?.email, monthStart],
    queryFn: () => base44.entities.Booking.filter({ student_email: user?.email }, "-session_date", 100),
    enabled: !!user?.email,
    select: (data) =>
      data.filter(
        (b) => b.status !== "cancelada" && b.session_date >= monthStart && b.session_date <= monthEnd
      ),
  });

  const { data: lastPayment } = useQuery({
    queryKey: ["lastPayment", user?.email],
    queryFn: async () => {
      const list = await base44.entities.PaymentHistory.filter({ user_email: user?.email }, "-payment_date", 1);
      return list[0] || null;
    },
    enabled: !!user?.email,
  });

  const planMaxCreditsFallback = { "4_aulas": 4, "8_aulas": 8, "12_aulas": 12, "avulsa": 1 };

  const entityData = userEntity?.data || {};
  const currentUser = userEntity || userData || user;
  const plan = entityData?.plan || currentUser?.plan || "4_aulas";
  const planFromDb = studioPlans.find((p) => p.key === plan);
  const planData = planFromDb
    ? { label: planFromDb.label, price: planFromDb.price || `R$ ${planFromDb.price_value || ""}`, color: "bg-primary/10 text-primary" }
    : (planInfo[plan] || { label: plan.replace(/_/g, " "), price: "", color: "bg-muted text-muted-foreground" });
  const { isTeacher } = useRoles();
  const credits = getCredits(userEntity || currentUser);
  const maxCredits = planFromDb?.credits || planMaxCreditsFallback[plan] || 4;
  const usedThisMonth = monthBookings.length;

  React.useEffect(() => {
    const source = userEntity || userData;
    if (source && !form) {
      const d = source.data || {};
      setForm({
        full_name: source.full_name || user?.full_name || "",
        phone: d.phone || source.phone || "",
        birth_date: d.birth_date || source.birth_date || "",
        profile_image_url: d.profile_image_url || source.profile_image_url || "",
      });
    }
  }, [userEntity, userData]);

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, profile_image_url: file_url }));
      toast.success("Foto carregada!");
    } catch {
      toast.error("Erro ao carregar foto");
    }
    setUploadingPhoto(false);
  };

  const handleSave = async () => {
    if (!userEntity?.id) return;
    setSaving(true);
    try {
      // Salva campos pessoais dentro de data, preservando créditos e plano
      const existingData = userEntity.data || {};
      await base44.entities.User.update(userEntity.id, {
        data: {
          ...existingData,
          phone: form.phone,
          birth_date: form.birth_date,
          profile_image_url: form.profile_image_url,
        }
      });
      await base44.auth.updateMe({ full_name: form.full_name });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userCredits"] });
      toast.success("Dados atualizados!");
    } catch {
      toast.error("Erro ao salvar");
    }
    setSaving(false);
  };

  if ((isLoading || loadingEntity) || !form) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 font-body">
      <SectionHeader
        eyebrow="Sua conta"
        title="Meu Perfil"
        goldWord="Perfil"
        subtitle="Seus dados pessoais e informações do plano"
      />

      {/* Foto + nome */}
      <div className="flex items-center gap-4 mb-6 p-5 rounded-2xl border border-border bg-card">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-primary font-bold text-2xl font-heading">
            {form.profile_image_url ? (
              <img src={form.profile_image_url} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              (form.full_name || user?.email || "?")[0].toUpperCase()
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 shadow"
          >
            {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-xl font-semibold truncate">{form.full_name || user?.email}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          <Badge className={`mt-1.5 border-0 text-xs ${isTeacher ? "bg-accent/15 text-accent-foreground" : planData.color}`}>{isTeacher ? "Professora" : planData.label}</Badge>
        </div>
      </div>

      {/* Plano e créditos */}
      {!isTeacher && (
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Plano</p>
          <p className="font-heading text-lg font-bold">{planData.label}</p>
          <p className="text-xs text-primary font-medium">{planData.price}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Créditos disponíveis</p>
          <p className="font-heading text-2xl font-bold text-primary">{credits}</p>
          <p className="text-xs text-muted-foreground">de {maxCredits} aulas</p>
          <div className="mt-2 w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${Math.max(0, Math.min(100, (credits / maxCredits) * 100))}%` }}
            />
          </div>
        </div>
      </div>
      )}

      {/* Datas do plano */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {!isTeacher && entityData?.plan_start_date && (
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <CalendarDays className="h-3 w-3" /> Início do plano
            </p>
            <p className="font-medium text-sm">
              {formatSafe(entityData.plan_start_date, "dd/MM/yyyy")}
            </p>
          </div>
        )}
        {!isTeacher && entityData?.last_payment_date && (
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <RefreshCw className="h-3 w-3" /> Última renovação
            </p>
            <p className="font-medium text-sm">
              {formatSafe(entityData.last_payment_date, "dd/MM/yyyy")}
            </p>
            {lastPayment?.payment_method && (
              <p className="text-xs text-primary mt-1 font-medium">
                {lastPayment.payment_method === "pix" ? "PIX" : lastPayment.payment_method === "cartao_credito" ? "Cartão de crédito" : lastPayment.payment_method}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Válido por 30 dias</p>
          </div>
        )}
      </div>

      {/* Formulário */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-heading text-lg font-semibold">Dados Pessoais</h2>
        <div>
          <Label className="text-xs mb-1 block">Nome completo</Label>
          <Input
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Seu nome"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> Telefone / WhatsApp</span>
          </Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="(11) 99999-9999"
          />
        </div>
        <div className="min-w-0">
          <Label className="text-xs mb-1 block">
            <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Data de nascimento</span>
          </Label>
          <Input
            type="date"
            value={form.birth_date}
            onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
            className="mobile-native-field h-9 w-full block"
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full rounded-full gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar alterações</>}
        </Button>
      </div>

      {/* Histórico de pagamentos */}
      {userData?.id && <MyPaymentHistory userId={userData.id} />}
    </div>
  );
}