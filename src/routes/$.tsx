import { createFileRoute } from "@tanstack/react-router";
import { AppMount } from "@/lib/AppMount";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Studio Praiana Pole Dance | Aulas e perfil" },
      { name: "description", content: "Acompanhe suas aulas e seu perfil no Studio Praiana Pole Dance." },
      { property: "og:title", content: "Studio Praiana Pole Dance | Aulas e perfil" },
      { property: "og:description", content: "Acompanhe suas aulas e seu perfil no Studio Praiana Pole Dance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppMount,
});
