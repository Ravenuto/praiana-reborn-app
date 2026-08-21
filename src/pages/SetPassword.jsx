import praianaLogo from "@/assets/praiana-logo.png.asset.json";
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function SetPassword() {
  const { checkUserAuth } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("A senha deve ter pelo menos 6 caracteres");
    if (password !== confirm) return setError("As senhas não coincidem");
    setLoading(true);
    try {
      await base44.auth.changePassword(password);
      await checkUserAuth();
      toast.success("Senha criada com sucesso!");
      window.location.assign("/");
    } catch (err) {
      setError(err?.message || "Erro ao salvar a senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 bg-primary/15 organic-blob animate-blob-morph" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-20 w-96 h-96 bg-accent/15 organic-blob-2 animate-float-slow" />

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <span className="relative h-24 w-24 rounded-full bg-white ring-2 ring-white/70 shadow-[0_18px_50px_-15px_hsl(var(--primary)/0.45)] overflow-hidden grid place-items-center">
              <img src={praianaLogo.url} alt="Studio Praiana Pole Dance" className="h-full w-full object-contain scale-[1.12]" />
            </span>
          </div>
          <h1 className="font-heading italic text-primary text-2xl sm:text-3xl">Crie sua senha</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Este é o seu primeiro acesso. Escolha uma senha só sua para continuar.
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="new-password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  autoFocus
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="confirm-password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <>Salvar senha →</>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
