import { createFileRoute } from "@tanstack/react-router";
import { AppMount } from "@/lib/AppMount";

export const Route = createFileRoute("/$")({
  component: AppMount,
});
