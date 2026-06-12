import logoPraiana from "@/assets/logo-praiana.png";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
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
        {/* Branding Praiana */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <img
              src={logoPraiana}
              alt="Praiana Pole Dance"
              className="w-24 h-24 object-contain animate-float-y dark:bg-white dark:rounded-xl dark:p-1 dark:ring-1 dark:ring-white/70"
            />
          </div>
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground">Praiana Pole Dance</h1>
          <p className="font-script text-2xl text-primary mt-1">bem-vinda de volta</p>
          <p className="text-muted-foreground mt-2 text-sm">Entre na sua conta</p>
        </div>


        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

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
                  Entrar <span className="text-base">→</span>
                </>
              )}
            </Button>

          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Quer se matricular?{" "}
          <a
            href="https://wa.me/5500000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            Entre em contato pelo WhatsApp
          </a>
        </p>
      </div>
    </div>
  );
}