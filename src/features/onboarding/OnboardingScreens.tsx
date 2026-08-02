import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { CheckCircle2, Home, UserRound } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { Card } from "@/components/primitives/Card";
import { AppText } from "@/components/primitives/AppText";
import { Button } from "@/components/primitives/Button";
import { Screen } from "@/components/layout/Screen";
import { colors, spacing } from "@/theme/tokens";
import { DynamicForm, type DynamicField } from "@/features/shared/DynamicForm";
import { updateProfile } from "@/repositories/auth";
import { createFarm } from "@/repositories/farms";
import { farmSchema, profileSchema, type FarmValues, type ProfileValues } from "@/schemas/forms";
import { productionTypeOptions } from "@/constants/catalogs";
import { useAuth } from "@/providers/AuthProvider";
import { useActiveFarm } from "@/providers/ActiveFarmProvider";
import { getErrorMessage } from "@/lib/errors";
import { formResolver } from "@/lib/formResolver";

const profileFields: DynamicField<ProfileValues>[] = [
  { name: "full_name", label: "Nombre completo", placeholder: "Ej. Maira Alejandra Rojas" },
  { name: "phone", label: "Telefono o WhatsApp", placeholder: "Ej. 310 000 0000" },
  { name: "avatar_url", label: "Foto de perfil", placeholder: "URL de imagen o dejalo vacio" }
];

const farmFields: DynamicField<FarmValues>[] = [
  { name: "name", label: "Nombre de la finca", placeholder: "Ej. Finca La Esperanza" },
  {
    name: "production_type",
    label: "Actividad principal",
    kind: "choice",
    options: productionTypeOptions
  },
  { name: "department", label: "Departamento", placeholder: "Ej. Meta" },
  { name: "municipality", label: "Municipio", placeholder: "Ej. Granada" },
  { name: "address_description", label: "Como llegar", placeholder: "Vereda, referencia o indicaciones", kind: "textarea" },
  { name: "area", label: "Area", placeholder: "Ej. 12", kind: "number" },
  {
    name: "area_unit",
    label: "Unidad de area",
    kind: "choice",
    options: [
      { label: "Hectareas", value: "hectares" },
      { label: "Fanegadas", value: "fanegadas" },
      { label: "Metros cuadrados", value: "square_meters" }
    ]
  },
  { name: "description", label: "Descripcion", placeholder: "Cultivos, ganado o datos utiles", kind: "textarea" }
];

export function ProfileOnboardingScreen() {
  const { profile, refreshProfile } = useAuth();
  const form = useForm<ProfileValues>({
    resolver: formResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      avatar_url: profile?.avatar_url ?? ""
    }
  });

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await refreshProfile();
      router.replace("/(onboarding)/farm");
    }
  });

  return (
    <Screen title="Tus datos" subtitle="Primero necesitamos saber quien administra la finca.">
      <Card style={styles.card}>
        <UserRound color={colors.forestDark} size={28} />
        <DynamicForm
          form={form}
          fields={profileFields}
          onSubmit={(values) => mutation.mutate(values)}
          submitLabel="Guardar y continuar"
          loading={mutation.isPending}
        />
        {mutation.isError ? <AppText color={colors.error}>{getErrorMessage(mutation.error)}</AppText> : null}
      </Card>
    </Screen>
  );
}

export function FarmOnboardingScreen() {
  const queryClient = useQueryClient();
  const { setActiveFarmId } = useActiveFarm();
  const form = useForm<FarmValues>({
    resolver: formResolver(farmSchema),
    defaultValues: {
      name: "",
      description: "",
      production_type: "mixed",
      department: "",
      municipality: "",
      address_description: "",
      area: null,
      area_unit: "hectares"
    }
  });

  const mutation = useMutation({
    mutationFn: createFarm,
    onSuccess: async (farm) => {
      await queryClient.invalidateQueries({ queryKey: ["farms"] });
      await setActiveFarmId(farm.id);
      router.replace("/(onboarding)/guide");
    }
  });

  return (
    <Screen title="Primera finca" subtitle="Crea el espacio donde guardaras animales, productos, tareas y reportes.">
      <Card style={styles.card}>
        <Home color={colors.forestDark} size={28} />
        <DynamicForm
          form={form}
          fields={farmFields}
          onSubmit={(values) => mutation.mutate(values)}
          submitLabel="Crear finca"
          loading={mutation.isPending}
        />
        {mutation.isError ? <AppText color={colors.error}>{getErrorMessage(mutation.error)}</AppText> : null}
      </Card>
    </Screen>
  );
}

export function GuideScreen() {
  return (
    <Screen title="Listo para empezar" subtitle="AgroSmart queda preparado para trabajar de forma sencilla desde el celular.">
      <Card style={styles.card}>
        <CheckCircle2 color={colors.success} size={34} />
        <GuideLine title="Produccion" text="Registra ganado, productos agricolas y movimientos de inventario." />
        <GuideLine title="Trabajo diario" text="Crea tareas, asigna responsables y programa recordatorios." />
        <GuideLine title="Control" text="Consulta finanzas basicas, reportes y soporte tecnico." />
        <Button title="Entrar al panel" onPress={() => router.replace("/(app)/dashboard")} fullWidth />
      </Card>
    </Screen>
  );
}

function GuideLine({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.guideLine}>
      <AppText variant="subtitle">{title}</AppText>
      <AppText color={colors.mutedText}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md
  },
  guideLine: {
    gap: spacing.xs
  }
});
