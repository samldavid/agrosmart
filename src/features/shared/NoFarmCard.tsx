import { router } from "expo-router";

import { EmptyState } from "@/components/feedback/States";

export function NoFarmCard() {
  return (
    <EmptyState
      title="Crea tu primera finca"
      message="Para registrar ganado, productos, tareas o finanzas necesitas una finca activa."
      actionLabel="Crear finca"
      onAction={() => router.push("/(onboarding)/farm")}
    />
  );
}
