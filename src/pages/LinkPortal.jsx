import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

function decodePortalUrl(raw) {
  if (!raw) return null;
  try {
    const base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const url = atob(base64);
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

export default function LinkPortal() {
  const target = useMemo(() => {
    const query = new URLSearchParams(window.location.search);
    return decodePortalUrl(query.get("u"));
  }, []);

  return (
    <AuthLayout
      icon={ShieldCheck}
      title="Quase lá!"
      subtitle="Toque no botão abaixo para continuar com segurança"
    >
      {target ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Por segurança, esta etapa confirma que é você mesma abrindo o link.
          </p>
          <Button asChild className="w-full">
            <a href={target}>Continuar</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <p role="alert" className="text-sm text-foreground">
            Este link é inválido ou está incompleto. Peça um novo convite ao estúdio ou solicite outro link de senha.
          </p>
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Solicitar outro link
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
