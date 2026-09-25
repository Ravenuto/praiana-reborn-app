import { createFileRoute } from "@tanstack/react-router";
import { AppMount } from "@/lib/AppMount";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Studio Praiana Pole Dance | Início" },
      {
        name: "description",
        content: "Acesse suas aulas, horários e reservas no Studio Praiana Pole Dance.",
      },
      { property: "og:title", content: "Studio Praiana Pole Dance | Início" },
      {
        property: "og:description",
        content: "Acesse suas aulas, horários e reservas no Studio Praiana Pole Dance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppMount,
});
