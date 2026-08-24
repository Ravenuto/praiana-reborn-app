import praianaLogo from "@/assets/praiana-logo.png.asset.json";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Eye, EyeOff, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useSiteContent } from "@/lib/siteContent";

export default function Login() {
  const c = useSiteContent();
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState("aluna");
  const [info, setInfo] = useState("");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await base44.auth.loginViaEmailPassword({ email, password, mode, remember: rememberMe });
      if (res?.isAdmin) {
        const { importLocalStoreOnce } = await import("@/lib/importLocalStore");
        await importLocalStoreOnce();
      }
      const home = mode === "professor" ? "/professor" : mode === "admin" ? "/admin" : "/";
      window.location.href = res?.mustChangePassword ? "/definir-senha" : home;
    } catch (err) {
      setError(err.message || "Email ou senha inválidos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      {/* Decorative blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 bg-primary/15 organic-blob animate-blob-morph" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-20 w-96 h-96 bg-accent/15 organic-blob-2 animate-float-slow" />

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Branding Raissa */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-accent/30 blur-2xl animate-pulse-ring" />
              <div className="relative h-28 w-28 rounded-full bg-white backdrop-blur ring-2 ring-white/70 shadow-[0_18px_50px_-15px_hsl(var(--primary)/0.45)] overflow-hidden animate-float-y grid place-items-center">
                <img
                  src={c.content_login_logo || praianaLogo.url}
                  alt="Studio Praiana Pole Dance"
                  className="h-full w-full object-contain scale-[1.12]"
                />
              </div>
            </div>
          </div>
          <h1 className="font-heading italic text-primary text-3xl sm:text-4xl leading-tight whitespace-nowrap">
            {c.content_login_title_prefix} <span className="text-accent not-italic font-semibold">{c.content_login_title_highlight}</span> {c.content_login_title_suffix}
          </h1>

          <p className="font-script text-lg text-primary mt-1">{c.content_login_script}</p>
          <p className="text-muted-foreground mt-2 text-sm">{c.content_login_subtitle}</p>

        </div>



        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {info && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 text-primary text-sm">
              {info}
            </div>
          )}

          <div className="mb-5 grid grid-cols-3 gap-1 p-1 rounded-full bg-muted">
            {[
              { key: "aluna", label: "SOU ALUNA", Icon: GraduationCap },
              { key: "professor", label: "SOU PROFESSORA", Icon: Sparkles },
              { key: "admin", label: "SOU ADMIN", Icon: ShieldCheck },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setMode(key); setError(""); setInfo(""); }}
                className={`flex items-center justify-center gap-1 rounded-full px-1.5 py-2 text-[10px] font-semibold tracking-wide transition-colors ${
                  mode === key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="rememberMe" checked={rememberMe} onCheckedChange={setRememberMe} />
              <label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer select-none">
                Manter conectado
              </label>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  {c.content_login_submit} <span className="text-base">→</span>
                </>
              )}
            </Button>

          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {c.content_login_signup_text}{" "}
          <a
            href={c.content_home_whatsapp_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            {c.content_login_signup_link_label}
          </a>
        </p>

      </div>
    </div>
  );
}