import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Bell, Download, HelpCircle, Lock, LogOut, ShieldCheck, Trash2, Users } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { LoadingState, EmptyState } from "@/components/feedback/States";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/primitives/AppText";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { productionTypeOptions } from "@/constants/catalogs";
import { DynamicForm, type DynamicField } from "@/features/shared/DynamicForm";
import { downloadTextFile } from "@/lib/downloads";
import { getErrorMessage } from "@/lib/errors";
import { formResolver } from "@/lib/formResolver";
import { useActiveFarm } from "@/providers/ActiveFarmProvider";
import { useAuth } from "@/providers/AuthProvider";
import { updateProfile } from "@/repositories/auth";
import { createSupportTicket } from "@/repositories/support";
import { inviteFarmMember, listFarmMembers, updateFarm } from "@/repositories/farms";
import {
  farmSchema,
  profileSchema,
  workerInviteSchema,
  type FarmValues,
  type ProfileValues,
  type WorkerInviteValues
} from "@/schemas/forms";
import { colors, spacing } from "@/theme/tokens";

const profileFields: DynamicField<ProfileValues>[] = [
  { name: "full_name", label: "Nombre completo", placeholder: "Tu nombre" },
  { name: "phone", label: "Telefono", placeholder: "WhatsApp o celular" },
  { name: "avatar_url", label: "Fotografia", placeholder: "URL de foto o dejalo vacio" }
];

const workerFields: DynamicField<WorkerInviteValues>[] = [
  { name: "email", label: "Correo del trabajador", kind: "email", placeholder: "trabajador@ejemplo.com" },
  {
    name: "role",
    label: "Rol en la finca",
    kind: "choice",
    options: [
      { label: "Trabajador", value: "worker" },
      { label: "Encargado", value: "manager" }
    ]
  },
  {
    name: "can_manage_inventory",
    label: "Puede gestionar inventario",
    kind: "choice",
    options: [
      { label: "Si", value: "true" },
      { label: "No", value: "false" }
    ]
  },
  {
    name: "can_report_expenses",
    label: "Puede reportar gastos",
    kind: "choice",
    options: [
      { label: "Si", value: "true" },
      { label: "No", value: "false" }
    ]
  },
  {
    name: "can_manage_tasks",
    label: "Puede gestionar tareas",
    kind: "choice",
    options: [
      { label: "Si", value: "true" },
      { label: "No", value: "false" }
    ]
  }
] as DynamicField<WorkerInviteValues>[];

export function SettingsScreen() {
  const { profile, refreshProfile, signOut } = useAuth();
  const { activeFarm, activeFarmId, farms } = useActiveFarm();
  const queryClient = useQueryClient();

  const profileForm = useForm<ProfileValues>({
    resolver: formResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      avatar_url: profile?.avatar_url ?? ""
    }
  });

  const farmForm = useForm<FarmValues>({
    resolver: formResolver(farmSchema),
    defaultValues: {
      name: activeFarm?.name ?? "",
      description: activeFarm?.description ?? "",
      production_type: activeFarm?.production_type ?? "mixed",
      department: activeFarm?.department ?? "",
      municipality: activeFarm?.municipality ?? "",
      address_description: activeFarm?.address_description ?? "",
      area: activeFarm?.area ?? null,
      area_unit: activeFarm?.area_unit ?? "hectares"
    }
  });

  const workerForm = useForm<WorkerInviteValues>({
    resolver: formResolver(workerInviteSchema),
    defaultValues: {
      email: "",
      role: "worker",
      can_manage_inventory: false,
      can_report_expenses: true,
      can_manage_tasks: true
    }
  });

  const membersQuery = useQuery({
    queryKey: ["farm_members", activeFarmId],
    queryFn: () => listFarmMembers(activeFarmId ?? ""),
    enabled: Boolean(activeFarmId)
  });

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => refreshProfile()
  });
  const farmMutation = useMutation({
    mutationFn: (values: FarmValues) => {
      if (!activeFarmId) {
        throw new Error("Selecciona una finca.");
      }
      return updateFarm(activeFarmId, values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["farms"] });
    }
  });
  const workerMutation = useMutation({
    mutationFn: (values: WorkerInviteValues) => {
      if (!activeFarmId) {
        throw new Error("Selecciona una finca.");
      }
      return inviteFarmMember(activeFarmId, values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["farm_members", activeFarmId] });
      workerForm.reset();
    }
  });
  const deleteRequestMutation = useMutation({
    mutationFn: () =>
      createSupportTicket({
        farm_id: activeFarmId,
        subject: "Solicitud de eliminacion de cuenta",
        description: "Solicito eliminar mi cuenta y recibir indicaciones para exportar mis datos.",
        category: "privacidad",
        priority: "high"
      })
  });

  async function exportData(): Promise<void> {
    const payload = JSON.stringify({ profile, farms }, null, 2);
    await downloadTextFile("agrosmart-exportacion-datos.json", payload, "application/json");
  }

  const farmFields: DynamicField<FarmValues>[] = [
    { name: "name", label: "Nombre de la finca" },
    { name: "production_type", label: "Actividad", kind: "choice", options: productionTypeOptions },
    { name: "department", label: "Departamento" },
    { name: "municipality", label: "Municipio" },
    { name: "address_description", label: "Como llegar", kind: "textarea" },
    { name: "area", label: "Area", kind: "number" },
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
    { name: "description", label: "Descripcion", kind: "textarea" }
  ];

  return (
    <Screen title="Mas y configuracion" subtitle="Perfil, finca, trabajadores, seguridad, ayuda y privacidad.">
      <Card style={styles.wrap}>
        <AppText variant="subtitle">Datos personales</AppText>
        <DynamicForm
          form={profileForm}
          fields={profileFields}
          onSubmit={(values) => profileMutation.mutate(values)}
          submitLabel="Guardar perfil"
          loading={profileMutation.isPending}
        />
        {profileMutation.isError ? <AppText color={colors.error}>{getErrorMessage(profileMutation.error)}</AppText> : null}
      </Card>

      <Card style={styles.wrap}>
        <AppText variant="subtitle">Datos de finca</AppText>
        {activeFarm ? (
          <DynamicForm
            form={farmForm}
            fields={farmFields}
            onSubmit={(values) => farmMutation.mutate(values)}
            submitLabel="Guardar finca"
            loading={farmMutation.isPending}
          />
        ) : (
          <Button title="Crear finca" onPress={() => router.push("/(onboarding)/farm")} />
        )}
        {farmMutation.isError ? <AppText color={colors.error}>{getErrorMessage(farmMutation.error)}</AppText> : null}
      </Card>

      <Card style={styles.wrap}>
        <View style={styles.row}>
          <Users color={colors.forestDark} size={22} />
          <AppText variant="subtitle">Trabajadores</AppText>
        </View>
        <DynamicForm
          form={workerForm}
          fields={workerFields}
          onSubmit={(values) => workerMutation.mutate(coerceWorker(values))}
          submitLabel="Registrar o invitar"
          loading={workerMutation.isPending}
        />
        {workerMutation.isError ? <AppText color={colors.error}>{getErrorMessage(workerMutation.error)}</AppText> : null}
        {membersQuery.isLoading ? <LoadingState title="Cargando trabajadores" /> : null}
        {membersQuery.data?.length === 0 ? (
          <EmptyState title="Sin trabajadores" message="Registra trabajadores para asignar tareas." />
        ) : (
          (membersQuery.data ?? []).map((member) => (
            <View key={member.id} style={styles.memberLine}>
              <AppText variant="bodyMedium">{member.invited_email ?? member.user_id ?? "Trabajador"}</AppText>
              <AppText variant="caption" color={colors.mutedText}>
                {member.role} · {member.status}
              </AppText>
            </View>
          ))
        )}
      </Card>

      <Card style={styles.wrap}>
        <SettingsLine icon={<Lock color={colors.forestDark} size={20} />} title="Seguridad" text="Recuperacion de contrasena disponible desde inicio de sesion." />
        <SettingsLine icon={<ShieldCheck color={colors.forestDark} size={20} />} title="Privacidad" text="Puedes exportar datos o solicitar eliminacion de cuenta." />
        <SettingsLine icon={<Bell color={colors.forestDark} size={20} />} title="Notificaciones" text="El MVP usa notificaciones internas; push queda preparado para fase 2." />
        <SettingsLine icon={<HelpCircle color={colors.forestDark} size={20} />} title="Ayuda" text="Crea un ticket de soporte cuando necesites orientacion." />
        <AppText variant="caption" color={colors.mutedText}>
          AgroSmart v0.1.0 · Tecnologia inteligente para el campo y tu ganado.
        </AppText>
        <View style={styles.actionRow}>
          <Button title="Exportar mis datos" variant="secondary" icon={<Download color={colors.forestDark} size={18} />} onPress={() => void exportData()} />
          <Button title="Solicitar eliminacion" variant="danger" icon={<Trash2 color={colors.white} size={18} />} onPress={() => deleteRequestMutation.mutate()} loading={deleteRequestMutation.isPending} />
          <Button title="Cerrar sesion" variant="ghost" icon={<LogOut color={colors.error} size={18} />} onPress={() => void signOut().then(() => router.replace("/(auth)/sign-in"))} />
        </View>
      </Card>
    </Screen>
  );
}

function coerceWorker(values: WorkerInviteValues): WorkerInviteValues {
  return {
    ...values,
    can_manage_inventory: String(values.can_manage_inventory) === "true",
    can_report_expenses: String(values.can_report_expenses) === "true",
    can_manage_tasks: String(values.can_manage_tasks) === "true"
  };
}

function SettingsLine({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <View style={styles.settingsLine}>
      {icon}
      <View style={styles.settingsText}>
        <AppText variant="bodyMedium">{title}</AppText>
        <AppText variant="caption" color={colors.mutedText}>
          {text}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  memberLine: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: spacing.sm
  },
  settingsLine: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center"
  },
  settingsText: {
    flex: 1
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
