import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { base44 } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2 } from "lucide-react";

export default function AcceptInvitation() {
  const [status, setStatus] = useState("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const checkLink = async () => {
      const query = new URLSearchParams(window.location.search);
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      if (query.get("error") || fragment.get("error")) {
        if (active) setStatus("invalid");
        return;
      }

      const tokenHash = query.get("token_hash");
      const type = query.get("type");
      const expectedType = query.get("origem");
      const hasRedirectSession = fragment.has("access_token") && fragment.has("refresh_token");
      const isEmailLink = expectedType === "convite" || expectedType === "recuperacao" || hasRedirectSession;
      if (!isEmailLink && !tokenHash) {
        if (active) setStatus("invalid");
        return;
      }
      if (tokenHash && (type === "invite" || type === "recovery")) {
        const { error: tokenError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (tokenError) {
          if (active) setStatus("invalid");
          return;
        }
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError || !data.session) {
        setStatus("invalid");
        return;
      }
      window.history.replaceState(null, "", window.location.pathname);
      setStatus("ready");
    };
    checkLink();
    return () => { active = false; };
  }, []);

  const savePassword = async (event) => {
    event.preventDefault();
    setError("");
    if (password.length < 6) return setError("A senha deve ter pelo menos 6 caracteres.");
    if (password !== confirmation) return setError("As senhas não coincidem.");
    setStatus("saving");
    try {
      await base44.auth.changePassword(password);
      await base44.auth.logout();
      setStatus("done");
    } catch (err) {
      setError(err?.message || "Não foi possível salvar a senha. Tente novamente.");
      setStatus("ready");
    }
  };

  return (
    <AuthLayout icon={KeyRound} title="Crie sua senha" subtitle="Escolha uma senha para acessar o Studio Praiana Pole Dance">
      {status === "checking" && <p role="status" className="text-center text-sm text-muted-foreground">Verificando seu convite...</p>}
      {status === "invalid" && (
        <div className="space-y-4 text-center">
          <p role="alert" className="text-sm text-foreground">Este link é inválido ou expirou. Peça um novo convite ao estúdio ou solicite outro link de senha.</p>
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">Solicitar outro link</Link>
        </div>
      )}
      {status === "done" && (
        <div className="space-y-4 text-center">
          <p role="status" className="text-sm text-foreground">Senha criada com sucesso. Agora você pode entrar com seu e-mail e sua nova senha.</p>
          <Button asChild className="w-full"><Link to="/login">Ir para o login</Link></Button>
        </div>
      )}
      {(status === "ready" || status === "saving") && (
        <form onSubmit={savePassword} className="space-y-4">
          {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="invite-password">Nova senha</Label>
            <Input id="invite-password" type="password" autoComplete="new-password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-confirmation">Confirme a senha</Label>
            <Input id="invite-confirmation" type="password" autoComplete="new-password" minLength={6} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={status === "saving"}>
            {status === "saving" ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : "Criar senha"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}