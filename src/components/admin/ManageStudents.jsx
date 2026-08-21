import React, { useState } from "react";
import { base44, ADMIN_EMAIL, getDefaultPassword } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Mail, Loader2, ShieldCheck, KeyRound, Sparkles, Plus, Minus, Trash2, Pencil, Search, ChevronDown, ChevronUp, DollarSign, Send, Check } from "lucide-react";
import PaymentHistoryDialog from "@/components/admin/PaymentHistoryDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const safeFormat = (value, fmt, opts) => {
  if (!value) return "—";
  const s = String(value);
  const d = new Date(s.length === 10 ? s + "T12:00:00" : s);
  if (isNaN(d.getTime())) return "—";
  try { return format(d, fmt, opts); } catch { return "—"; }
};

const EMPTY_MANUAL = { name: "", email: "", phone: "", birth_date: "", plan: "4_aulas", credits: 4 };

export default function ManageStudents() {
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [manualDialog, setManualDialog] = useState(false);
  const [manualForm, setManualForm] = useState(EMPTY_MANUAL);
  const [savingManual, setSavingManual] = useState(false);
  const [creditDialog, setCreditDialog] = useState(null);
  const [creditValue, setCreditValue] = useState(0);
  const [savingCredit, setSavingCredit] = useState(false);
  const [editDialog, setEditDialog] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todas");
  const [expandedId, setExpandedId] = useState(null);
  const [paymentDialog, setPaymentDialog] = useState(null);
  const [sendingWelcome, setSendingWelcome] = useState(null);
  const [welcomeSent, setWelcomeSent] = useState(() => new Set());
  const [resendingInvite, setResendingInvite] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [adminDialog, setAdminDialog] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: "", email: "" });
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [teacherDialog, setTeacherDialog] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ name: "", email: "" });
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [staffEdit, setStaffEdit] = useState(null);
  const [savingStaff, setSavingStaff] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ["studioPlans"],
    queryFn: () => base44.entities.StudioPlan.filter({ is_active: true }),
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const [allUsers, invites] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.StudentInvitation.filter({ status: "pending" }),
      ]);
      // Marca convites pendentes como is_invited para a UI
      const inviteRows = invites
        .filter((inv) => !allUsers.some((u) => u.email === inv.email))
        .map((inv) => ({
          id: inv.id,
          full_name: inv.full_name || "",
          email: inv.email,
          plan: inv.plan,
          credits: inv.credits,
          is_active: false,
          is_invited: true,
          role: "user",
        }));
      // Flatten data field so a aluna ative apareça com os campos esperados
      const normalUsers = allUsers.map((u) => ({
        ...u,
        ...(u.data || {}),
      }));
      return [...normalUsers, ...inviteRows];
    },
  });

  const planInfo = Object.fromEntries(
    plans.map((p) => [p.key, { label: p.label, credits: p.credits }])
  );

  const students = users.filter((u) => u.role !== "admin" && u.role !== "teacher" && u.is_teacher !== true);
  const admins = users.filter((u) => u.role === "admin" || u.is_admin === true);
  const teachers = users.filter((u) => (u.role === "teacher" || u.is_teacher === true) && u.role !== "admin");

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (s.full_name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q);
    const matchStatus =
      filterStatus === "todas" ||
      (filterStatus === "ativas" && s.is_active !== false) ||
      (filterStatus === "inativas" && s.is_active === false);
    return matchSearch && matchStatus;
  });

  const handleInvite = async () => {
    if (!inviteEmail.includes("@")) return toast.error("Email inválido");
    setInviting(true);
    try {
      // Cria StudentInvitation com plano padrão
      const defaultPlan = plans.find((p) => p.key === "4_aulas") || plans[0];
      await base44.entities.StudentInvitation.create({
        email: inviteEmail,
        plan: defaultPlan?.key || "4_aulas",
        credits: defaultPlan?.credits || 4,
        status: "pending",
        invited_date: new Date().toISOString(),
      });
      // Então convida o usuário
      await base44.users.inviteUser(inviteEmail, "user");
      setInviteEmail("");
      toast.success("Convite enviado para " + inviteEmail);
    } catch {
      toast.error("Erro ao enviar convite");
    }
    setInviting(false);
  };

  const handleSaveManual = async () => {
    if (!manualForm.name || !manualForm.email) return toast.error("Nome e email são obrigatórios");
    if (!manualForm.email.includes("@")) return toast.error("Email inválido");
    setSavingManual(true);
    try {
      const email = manualForm.email.trim().toLowerCase();
      const existingUsers = await base44.entities.User.filter({ email });
      if (existingUsers.length > 0) {
        toast.error("Já existe uma aluna com este email.");
        setSavingManual(false);
        return;
      }

      await base44.entities.User.create({
        full_name: manualForm.name,
        email,
        role: "user",
        is_admin: false,
        must_change_password: true,
        plan_status: "active",
        data: {
          full_name: manualForm.name,
          phone: manualForm.phone,
          birth_date: manualForm.birth_date,
          plan: manualForm.plan,
          credits: manualForm.credits,
          is_active: true,
          plan_start_date: new Date().toISOString().slice(0, 10),
        },
      });

      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success(`Aluna cadastrada! Primeiro acesso com a senha padrão "${getDefaultPassword()}".`);
      setManualDialog(false);
      setManualForm(EMPTY_MANUAL);
    } catch (err) {
      console.error("Erro ao cadastrar aluna:", err);
      toast.error("Erro ao cadastrar: " + (err?.message || "tente novamente"));
    }
    setSavingManual(false);
  };

  const handleResetPassword = async (student) => {
    if (!window.confirm(`Resetar a senha de ${student.full_name || student.email} para a senha padrão?`)) return;
    try {
      await base44.auth.resetToDefaultPassword(student.id);
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success(`Senha resetada para "${getDefaultPassword()}". Ela criará uma nova no próximo login.`);
    } catch {
      toast.error("Erro ao resetar senha");
    }
  };

  const handleAddAdmin = async () => {
    const email = (adminForm.email || "").trim().toLowerCase();
    if (!adminForm.name || !email.includes("@")) return toast.error("Nome e email válidos são obrigatórios");
    setSavingAdmin(true);
    try {
      const existing = await base44.entities.User.filter({ email });
      if (existing.length > 0) {
        await base44.entities.User.update(existing[0].id, { role: "admin", is_admin: true });
        toast.success("Acesso de administrador concedido.");
      } else {
        await base44.entities.User.create({
          full_name: adminForm.name,
          email,
          role: "admin",
          is_admin: true,
          is_active: true,
          must_change_password: true,
        });
        toast.success(`Administrador criado! Primeiro acesso com a senha padrão "${getDefaultPassword()}".`);
      }
      setAdminForm({ name: "", email: "" });
      setAdminDialog(false);
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    } catch (err) {
      toast.error("Erro ao cadastrar administrador: " + (err?.message || ""));
    }
    setSavingAdmin(false);
  };

  const handleRemoveAdmin = async (admin) => {
    if ((admin.email || "").toLowerCase() === ADMIN_EMAIL) return;
    if (!window.confirm(`Remover o acesso de administrador de ${admin.full_name || admin.email}?`)) return;
    try {
      await base44.entities.User.update(admin.id, { role: "user", is_admin: false });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("Acesso de administrador removido.");
    } catch {
      toast.error("Erro ao remover acesso");
    }
  };

  const handleAddTeacher = async () => {
    const email = (teacherForm.email || "").trim().toLowerCase();
    if (!teacherForm.name || !email.includes("@")) return toast.error("Nome e email válidos são obrigatórios");
    setSavingTeacher(true);
    try {
      const existing = await base44.entities.User.filter({ email });
      if (existing.length > 0) {
        await base44.entities.User.update(existing[0].id, { role: "teacher", is_teacher: true, is_active: true });
        toast.success("Acesso de professora concedido.");
      } else {
        await base44.entities.User.create({
          full_name: teacherForm.name,
          email,
          role: "teacher",
          is_teacher: true,
          is_active: true,
          must_change_password: true,
          data: { full_name: teacherForm.name },
        });
        toast.success(`Professora cadastrada! Primeiro acesso com a senha padrão "${getDefaultPassword()}".`);
      }
      setTeacherForm({ name: "", email: "" });
      setTeacherDialog(false);
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["teachersList"] });
    } catch (err) {
      toast.error("Erro ao cadastrar professora: " + (err?.message || ""));
    }
    setSavingTeacher(false);
  };

  const handleRemoveTeacher = async (teacher) => {
    if (!window.confirm(`Remover o acesso de professora de ${teacher.full_name || teacher.email}?`)) return;
    try {
      await base44.entities.User.delete(teacher.id);
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["teachersList"] });
      toast.success("Professora removida.");
    } catch {
      toast.error("Erro ao remover professora");
    }
  };

  const handleSaveStaff = async () => {
    if (!staffEdit) return;
    const name = (staffEdit.full_name || "").trim();
    if (!name) return toast.error("Informe o nome");
    setSavingStaff(true);
    try {
      await base44.entities.User.update(staffEdit.id, {
        full_name: name,
        data: { ...(staffEdit.data || {}), full_name: name },
      });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["teachersList"] });
      setStaffEdit(null);
      toast.success("Nome atualizado.");
    } catch {
      toast.error("Erro ao salvar nome");
    }
    setSavingStaff(false);
  };

  const handlePlanChange = async (student, plan) => {
    const selectedPlan = plans.find((p) => p.key === plan);
    const credits = selectedPlan?.credits || 4;
    if (student.is_invited) {
      await base44.entities.StudentInvitation.update(student.id, { plan, credits });
    } else {
      const [freshUser] = await base44.entities.User.filter({ email: student.email }, "-created_date", 1);
      if (freshUser) {
        const cleanData = Object.fromEntries(
          Object.entries(freshUser.data || {}).filter(([k]) => k !== 'data')
        );
        await base44.entities.User.update(freshUser.id, {
          data: { ...cleanData, plan, credits, plan_start_date: format(new Date(), "yyyy-MM-dd") }
        });
      }
    }
    queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    queryClient.invalidateQueries({ queryKey: ["userCredits", student.email] });
    toast.success("Plano atualizado! Créditos resetados para " + credits);
  };

  const handleSaveCredits = async () => {
    if (!creditDialog) return;
    setSavingCredit(true);
    const student = creditDialog.student;
    const newCredits = Math.max(0, (student.credits || 0) + creditValue);
    // Buscar usuário fresco do banco para ter o data atual correto
    const [freshUser] = await base44.entities.User.filter({ email: student.email }, "-created_date", 1);
    if (!freshUser) { toast.error("Usuário não encontrado"); setSavingCredit(false); return; }
    // Pegar data limpo (sem data.data aninhado)
    const cleanData = Object.fromEntries(
      Object.entries(freshUser.data || {}).filter(([k]) => k !== 'data')
    );
    await base44.entities.User.update(freshUser.id, {
      data: { ...cleanData, credits: newCredits }
    });
    queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    queryClient.invalidateQueries({ queryKey: ["userCredits", student.email] });
    queryClient.invalidateQueries({ queryKey: ["myProfile", student.email] });
    queryClient.invalidateQueries({ queryKey: ["myBookings"] });
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
    toast.success("Créditos atualizados!");
    setSavingCredit(false);
    setCreditDialog(null);
    setCreditValue(0);
  };

  const handleToggleActive = async (student) => {
    if (student.is_invited) {
      // Para invites pendentes, não muda nada (permanecem inativos)
      toast.info("Alunas com convite pendente não podem ser ativadas");
      return;
    }
    // Para usuários normais, apenas alterna o status
    const newStatus = student.is_active === false ? true : false;
    await base44.entities.User.update(student.id, {
      data: { ...(student.data || {}), is_active: newStatus }
    });
    queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    toast.success(newStatus ? "Aluna ativada" : "Aluna desativada");
  };

  const handleSendWelcomeEmail = async (student) => {
    setSendingWelcome(student.id);
    try {
      await base44.functions.invoke("sendWelcomeEmail", {
        studentEmail: student.email,
        studentName: student.full_name || "",
      });
      setWelcomeSent((prev) => new Set(prev).add(student.id));
      toast.success("Email de boas-vindas enviado");
    } catch {
      toast.error("Erro ao enviar email");
    }
    setSendingWelcome(null);
  };

  const handleResendInvite = async (student) => {
    setResendingInvite(student.id);
    try {
      await base44.functions.invoke("resendInviteEmail", {
        email: student.email,
      });
      toast.success("Email reenviado para " + student.email);
    } catch {
      toast.error("Erro ao reenviar email");
    }
    setResendingInvite(null);
  };

  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`Tem certeza que deseja deletar ${student.full_name || student.email}? Ela poderá se cadastrar novamente do zero.`)) {
      return;
    }
    setDeletingStudent(student.id);
    try {
      if (student.is_invited) {
        await base44.entities.StudentInvitation.delete(student.id);
      } else {
        // Deleta o usuário diretamente
        await base44.entities.User.delete(student.id);
        // Best-effort: também tenta no backend (se existir)
        try {
          await base44.functions.invoke("deleteStudent", {
            userId: student.id,
            email: student.email,
          });
        } catch { /* ignora se função não existir */ }
      }
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("Aluna deletada com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao deletar aluna");
    }
    setDeletingStudent(null);
  };


  const handleSaveEdit = async () => {
    if (!editDialog) return;
    if (editDialog.student.is_invited) {
      return toast.error("Não é possível editar convites pendentes");
    }
    setSavingEdit(true);
    const student = editDialog.student;
    await base44.entities.User.update(student.id, {
      full_name: editDialog.full_name,
      data: {
        ...(student.data || {}),
        full_name: editDialog.full_name,
        plan: student.plan,
        credits: student.credits,
        phone: editDialog.phone,
        birth_date: editDialog.birth_date,
        notes: editDialog.notes,
        plan_start_date: editDialog.plan_start_date,
      }
    });
    queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    queryClient.invalidateQueries({ queryKey: ["userCredits"] });
    queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    queryClient.invalidateQueries({ queryKey: ["myBookings"] });
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
    toast.success("Dados salvos!");
    setSavingEdit(false);
    setEditDialog(null);
  };


  return (
    <div>
      {/* Cadastrar */}
      <div className="mb-6 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Cadastrar nova aluna
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setManualDialog(true)} className="gap-2">
            <UserPlus className="h-4 w-4" /> Cadastro completo
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <h3 className="font-heading text-lg font-semibold whitespace-nowrap">Alunas cadastradas</h3>
          <Badge variant="secondary">{filtered.length}</Badge>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-28 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="ativas">Ativas</SelectItem>
              <SelectItem value="inativas">Inativas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl mb-3" />)
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">Nenhuma aluna encontrada</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((student) => {
            const plan = student.plan || "4_aulas";
            const info = planInfo[plan] || planInfo["4_aulas"];
            const isActive = student.is_active !== false;
            const isExpanded = expandedId === student.id;

            return (
              <div key={student.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Linha principal */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-primary font-bold text-base shrink-0 ${isActive ? "bg-primary/10" : "bg-muted"}`}>
                      {(student.full_name || student.email || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-base truncate leading-tight">{student.full_name || <span className="text-muted-foreground italic text-sm">Sem nome</span>}</p>
                        {student.is_invited && <Badge className="bg-amber-100 text-amber-700 border-0 text-xs gap-1"><Mail className="h-3 w-3" /> Email enviado</Badge>}
                        {isActive && !student.is_invited && <Badge className="bg-green-100 text-green-700 border-0 text-xs">Ativa</Badge>}
                        {!isActive && !student.is_invited && <Badge className="bg-red-100 text-red-700 border-0 text-xs">Inativa</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{student.email}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0 mt-0.5">
                        {student.phone && <p className="text-xs text-muted-foreground">{student.phone}</p>}
                        {student.plan_start_date && (
                          <p className="text-xs text-muted-foreground">
                            Plano desde {safeFormat(student.plan_start_date, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                        {(student.credits != null) && !student.is_invited && (
                          <p className="text-xs text-muted-foreground">{student.credits} crédito{student.credits !== 1 ? "s" : ""}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={plan} onValueChange={(v) => handlePlanChange(student, v)} disabled={student.is_invited}>
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((p) => (
                          <SelectItem key={p.key} value={p.key}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={() => { setCreditDialog({ student }); setCreditValue(0); }}
                      disabled={student.is_invited}
                    >
                      <Plus className="h-3 w-3" />
                      {student.credits || 0} créditos
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Editar detalhes"
                      onClick={() => setEditDialog({ student, full_name: student.full_name || "", phone: student.phone || "", birth_date: student.birth_date || "", notes: student.notes || "", plan_start_date: student.plan_start_date || "" })}
                      disabled={student.is_invited}
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Histórico de pagamentos"
                      onClick={() => setPaymentDialog(student)}
                    >
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Enviar email de boas-vindas"
                      onClick={() => handleSendWelcomeEmail(student)}
                      disabled={sendingWelcome === student.id}
                    >
                      {sendingWelcome === student.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                    {student.is_invited && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Reenviar convite por email"
                        onClick={() => handleResendInvite(student)}
                        disabled={resendingInvite === student.id}
                      >
                        {resendingInvite === student.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5 text-primary" />}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Resetar senha para a padrão"
                      onClick={() => handleResetPassword(student)}
                      disabled={student.is_invited}
                    >
                      <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Deletar aluna"
                      onClick={() => handleDeleteStudent(student)}
                      disabled={deletingStudent === student.id}
                    >
                      {deletingStudent === student.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-destructive" />}
                    </Button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : student.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Telefone</p>
                      <p className="font-medium">{student.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Data de nascimento</p>
                      <p className="font-medium">
                        {safeFormat(student.birth_date, "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Plano atual</p>
                      <Badge className={`${info.color} border-0 text-xs`}>{info.label}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Créditos restantes</p>
                      <p className="font-medium">{student.credits || 0} aulas</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Início do plano</p>
                      <p className="font-medium">
                        {safeFormat(student.plan_start_date, "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Último pagamento</p>
                      <p className="font-medium">
                        {safeFormat(student.last_payment_date, "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => handleToggleActive(student)}
                          disabled={student.is_invited}
                        />
                        <span className="text-xs">{student.is_invited ? "Inativa (convite pendente)" : isActive ? "Ativa" : "Inativa"}</span>
                      </div>
                    </div>
                    {student.notes && (
                      <div className="sm:col-span-3">
                        <p className="text-xs text-muted-foreground mb-0.5">Observações</p>
                        <p className="text-sm">{student.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Administradores */}
      <div className="mt-10 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Administradores
          </h3>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setAdminDialog(true)}>
            <UserPlus className="h-4 w-4" /> Novo administrador
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Quem estiver aqui entra pela opção "Sou administrador" no login, com a senha padrão "{getDefaultPassword()}" no primeiro acesso.
        </p>
        <div className="space-y-2">
          {admins.map((a) => {
            const isMain = (a.email || "").toLowerCase() === ADMIN_EMAIL;
            return (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isMain && <Badge variant="secondary" className="text-xs">Principal</Badge>}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Editar nome"
                    onClick={() => setStaffEdit({ ...a, full_name: a.full_name || "" })}
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Resetar senha"
                    onClick={() => handleResetPassword(a)}
                  >
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  {!isMain && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Remover acesso admin"
                      onClick={() => handleRemoveAdmin(a)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={adminDialog} onOpenChange={setAdminDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo administrador</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input
                value={adminForm.name}
                onChange={(e) => setAdminForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome do professor(a) ou admin"
                className="w-full min-w-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={adminForm.email}
                onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com"
                className="w-full min-w-0"
              />
            </div>
            <Button className="w-full" onClick={handleAddAdmin} disabled={savingAdmin}>
              {savingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar administrador"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Professores */}
      <div className="mt-6 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" /> Professores
          </h3>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setTeacherDialog(true)}>
            <UserPlus className="h-4 w-4" /> Nova professora
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          A professora entra pela opção "Sou professora" no login (senha padrão "{getDefaultPassword()}" no primeiro acesso) e vê só a área de presenças. Ela também aparece para escolher em Horários › Professora.
        </p>
        {teachers.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma professora cadastrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {teachers.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Editar nome" onClick={() => setStaffEdit({ ...t, full_name: t.full_name || "" })}>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Resetar senha" onClick={() => handleResetPassword(t)}>
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Remover professora" onClick={() => handleRemoveTeacher(t)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={teacherDialog} onOpenChange={setTeacherDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova professora</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input
                value={teacherForm.name}
                onChange={(e) => setTeacherForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome da professora"
                className="w-full min-w-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={teacherForm.email}
                onChange={(e) => setTeacherForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com"
                className="w-full min-w-0"
              />
            </div>
            <Button className="w-full" onClick={handleAddTeacher} disabled={savingTeacher}>
              {savingTeacher ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar professora"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!staffEdit} onOpenChange={(o) => !o && setStaffEdit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar nome</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input
                value={staffEdit?.full_name || ""}
                onChange={(e) => setStaffEdit((d) => ({ ...d, full_name: e.target.value }))}
                placeholder="Nome completo"
                className="w-full min-w-0"
              />
            </div>
            <p className="text-xs text-muted-foreground">{staffEdit?.email}</p>
            <Button className="w-full" onClick={handleSaveStaff} disabled={savingStaff}>
              {savingStaff ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog cadastro manual */}
      {manualDialog && (
        <Dialog open={manualDialog} onOpenChange={() => { setManualDialog(false); setManualForm(EMPTY_MANUAL); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-heading">Cadastrar Aluna</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs mb-1 block">Nome completo *</Label>
                <Input value={manualForm.name} onChange={(e) => setManualForm((f) => ({ ...f, name: e.target.value }))} className="h-8 text-sm" placeholder="Nome da aluna" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Email *</Label>
                <Input type="email" value={manualForm.email} onChange={(e) => setManualForm((f) => ({ ...f, email: e.target.value }))} className="h-8 text-sm" placeholder="email@exemplo.com" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Telefone / WhatsApp</Label>
                <Input value={manualForm.phone} onChange={(e) => setManualForm((f) => ({ ...f, phone: e.target.value }))} className="h-8 text-sm" placeholder="(99) 99999-9999" />
              </div>
              <div className="min-w-0">
                <Label className="text-xs mb-1 block">Data de nascimento</Label>
                <Input type="date" value={manualForm.birth_date} onChange={(e) => setManualForm((f) => ({ ...f, birth_date: e.target.value }))} className="mobile-native-field h-8 text-sm w-full block" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Plano inicial</Label>
                <Select value={manualForm.plan} onValueChange={(v) => {
                  const selectedPlan = plans.find((p) => p.key === v);
                  setManualForm((f) => ({ ...f, plan: v, credits: selectedPlan?.credits || 4 }));
                }}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.key} value={p.key}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Créditos iniciais</Label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setManualForm((f) => ({ ...f, credits: Math.max(0, f.credits - 1) }))}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-lg font-bold w-8 text-center">{manualForm.credits}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setManualForm((f) => ({ ...f, credits: f.credits + 1 }))}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Button onClick={handleSaveManual} disabled={savingManual} className="w-full rounded-full">
                {savingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar e enviar convite"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog créditos */}
      {creditDialog && (
        <Dialog open={!!creditDialog} onOpenChange={() => { setCreditDialog(null); setCreditValue(0); }}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle className="font-heading">Editar Créditos</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <p className="text-sm text-muted-foreground mb-4">
                {creditDialog.student.full_name || creditDialog.student.email}<br />
                <span className="font-semibold text-foreground">Atual: {creditDialog.student.credits || 0} créditos</span>
              </p>
              <Label className="text-xs mb-2 block">Ajuste (positivo = adicionar, negativo = remover)</Label>
              <div className="flex items-center gap-3 justify-center my-4">
                <Button variant="outline" size="icon" onClick={() => setCreditValue((v) => v - 1)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-3xl font-bold font-heading w-12 text-center">
                  {creditValue > 0 ? `+${creditValue}` : creditValue}
                </span>
                <Button variant="outline" size="icon" onClick={() => setCreditValue((v) => v + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Novo total: <strong>{Math.max(0, (creditDialog.student.credits || 0) + creditValue)}</strong> créditos
              </p>
              <Button onClick={handleSaveCredits} disabled={savingCredit || creditValue === 0} className="w-full rounded-full">
                {savingCredit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog histórico de pagamentos */}
      {paymentDialog && (
        <PaymentHistoryDialog student={paymentDialog} onClose={() => setPaymentDialog(null)} />
      )}

      {/* Dialog editar detalhes */}
      {editDialog && (
        <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-heading">Detalhes da Aluna</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs mb-1 block">Nome completo</Label>
                <Input value={editDialog.full_name} onChange={(e) => setEditDialog((d) => ({ ...d, full_name: e.target.value }))} className="h-8 text-sm" placeholder="Nome da aluna" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Plano</Label>
                <Select 
                  value={editDialog.student.plan || "4_aulas"} 
                  onValueChange={(v) => {
                    const selectedPlan = plans.find((p) => p.key === v);
                    setEditDialog((d) => ({ 
                      ...d, 
                      student: { ...d.student, plan: v, credits: selectedPlan?.credits || 4 }
                    }));
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.key} value={p.key}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Telefone / WhatsApp</Label>
                <Input value={editDialog.phone} onChange={(e) => setEditDialog((d) => ({ ...d, phone: e.target.value }))} className="h-8 text-sm" placeholder="(11) 99999-9999" />
              </div>
              <div className="min-w-0">
                <Label className="text-xs mb-1 block">Data de nascimento</Label>
                <Input type="date" value={editDialog.birth_date} onChange={(e) => setEditDialog((d) => ({ ...d, birth_date: e.target.value }))} className="mobile-native-field h-8 text-sm w-full block" />
              </div>
              <div className="min-w-0">
                <Label className="text-xs mb-1 block">Início do plano atual</Label>
                <Input type="date" value={editDialog.plan_start_date} onChange={(e) => setEditDialog((d) => ({ ...d, plan_start_date: e.target.value }))} className="mobile-native-field h-8 text-sm w-full block" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Observações</Label>
                <Input value={editDialog.notes} onChange={(e) => setEditDialog((d) => ({ ...d, notes: e.target.value }))} className="h-8 text-sm" placeholder="Ex: lesão no joelho..." />
              </div>
              <Button onClick={handleSaveEdit} disabled={savingEdit} className="w-full rounded-full">
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}