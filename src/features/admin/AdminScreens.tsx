import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { BellPlus, Building2, ClipboardList, LifeBuoy, Shield, Users } from "lucide-react-native";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, StyleSheet, View } from "react-native";

import { ErrorState, LoadingState, EmptyState } from "@/components/feedback/States";
import { TextField } from "@/components/forms/TextField";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/primitives/AppText";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { roleOptions, ticketPriorityOptions, ticketStatusOptions, userStatusOptions } from "@/constants/catalogs";
import { DynamicForm } from "@/features/shared/DynamicForm";
import { getErrorMessage } from "@/lib/errors";
import { formResolver } from "@/lib/formResolver";
import { formatDateTime } from "@/lib/formatters";
import {
  createAnnouncement,
  getAdminSummary,
  listAdminTickets,
  listAllFarms,
  listAnnouncements,
  listAuditLogs,
  listProfiles,
  updateUserAdmin
} from "@/repositories/admin";
import { updateSupportTicket } from "@/repositories/support";
import {
  adminUserUpdateSchema,
  announcementSchema,
  supportAdminUpdateSchema,
  type AdminUserUpdateValues,
  type AnnouncementValues,
  type SupportAdminUpdateValues
} from "@/schemas/forms";
import { colors, spacing } from "@/theme/tokens";
import type { Profile, SupportTicket } from "@/types/domain";

export function AdminDashboardScreen() {
  const summaryQuery = useQuery({ queryKey: ["admin_summary"], queryFn: getAdminSummary });

  return (
    <Screen title="Administracion" subtitle="Supervisa usuarios, fincas, soporte, avisos y auditoria.">
      {summaryQuery.isLoading ? <LoadingState title="Cargando administracion" /> : null}
      {summaryQuery.isError ? <ErrorState title="No pudimos cargar metricas" message={getErrorMessage(summaryQuery.error)} /> : null}
      {summaryQuery.data ? (
        <View style={styles.grid}>
          <AdminMetric title="Usuarios registrados" value={summaryQuery.data.users} icon={<Users color={colors.forestDark} />} href="/admin/users" />
          <AdminMetric title="Fincas creadas" value={summaryQuery.data.farms} icon={<Building2 color={colors.forestDark} />} href="/admin/farms" />
          <AdminMetric title="Animales" value={summaryQuery.data.activeAnimals} icon={<ClipboardList color={colors.forestDark} />} href="/admin/farms" />
          <AdminMetric title="Productos" value={summaryQuery.data.products} icon={<ClipboardList color={colors.forestDark} />} href="/admin/farms" />
          <AdminMetric title="Tickets abiertos" value={summaryQuery.data.openTickets} icon={<LifeBuoy color={colors.forestDark} />} href="/admin/support" />
          <AdminMetric title="Tareas pendientes" value={summaryQuery.data.pendingTasks} icon={<Shield color={colors.forestDark} />} href="/admin/audit" />
        </View>
      ) : null}
      <View style={styles.grid}>
        <AdminShortcut title="Usuarios" text="Buscar, filtrar, bloquear, activar y cambiar roles." href="/admin/users" />
        <AdminShortcut title="Soporte" text="Asignar, responder, priorizar, cerrar o reabrir tickets." href="/admin/support" />
        <AdminShortcut title="Avisos" text="Enviar avisos a usuarios, roles o fincas." href="/admin/announcements" />
        <AdminShortcut title="Auditoria" text="Revisar cambios criticos y actividad administrativa." href="/admin/audit" />
      </View>
    </Screen>
  );
}

function AdminMetric({ title, value, icon, href }: { title: string; value: number; icon: React.ReactNode; href: string }) {
  return (
    <Pressable onPress={() => router.push(href)}>
      <Card style={styles.metric}>
        {icon}
        <AppText variant="title">{String(value)}</AppText>
        <AppText color={colors.mutedText}>{title}</AppText>
      </Card>
    </Pressable>
  );
}

function AdminShortcut({ title, text, href }: { title: string; text: string; href: string }) {
  return (
    <Pressable onPress={() => router.push(href)}>
      <Card style={styles.shortcut}>
        <AppText variant="subtitle">{title}</AppText>
        <AppText color={colors.mutedText}>{text}</AppText>
      </Card>
    </Pressable>
  );
}

export function AdminUsersScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["admin_profiles"], queryFn: listProfiles });
  const form = useForm<AdminUserUpdateValues>({
    resolver: formResolver(adminUserUpdateSchema),
    defaultValues: { role: "producer", status: "active" }
  });
  const [selected, setSelected] = useState<Profile | null>(null);
  const mutation = useMutation({
    mutationFn: (values: AdminUserUpdateValues) => {
      if (!selected) {
        throw new Error("Selecciona un usuario.");
      }
      return updateUserAdmin(selected.id, values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin_profiles"] });
      setSelected(null);
    }
  });

  const users = (query.data ?? []).filter((user) => `${user.full_name} ${user.email} ${user.role} ${user.status}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <Screen title="Usuarios" subtitle="Gestiona perfiles, estado de cuenta y roles con confirmacion visual.">
      <TextField label="Buscar" placeholder="Nombre, correo, rol o estado" value={search} onChangeText={setSearch} />
      {query.isLoading ? <LoadingState title="Cargando usuarios" /> : null}
      {query.isError ? <ErrorState title="No pudimos cargar usuarios" message={getErrorMessage(query.error)} /> : null}
      <View style={styles.list}>
        {users.map((user) => (
          <Pressable
            key={user.id}
            onPress={() => {
              setSelected(user);
              form.reset({ role: user.role, status: user.status });
            }}
          >
            <Card style={styles.rowCard}>
              <View style={styles.flex}>
                <AppText variant="subtitle">{user.full_name || user.email || "Usuario"}</AppText>
                <AppText color={colors.mutedText}>
                  {user.email} · {roleOptions.find((option) => option.value === user.role)?.label ?? user.role}
                </AppText>
              </View>
              <AppText color={user.status === "blocked" ? colors.error : colors.success}>{user.status}</AppText>
            </Card>
          </Pressable>
        ))}
      </View>
      {selected ? (
        <Card style={styles.wrap}>
          <AppText variant="subtitle">Editar usuario: {selected.full_name || selected.email}</AppText>
          <DynamicForm
            form={form}
            fields={[
              { name: "role", label: "Rol", kind: "choice", options: roleOptions },
              { name: "status", label: "Estado", kind: "choice", options: userStatusOptions }
            ]}
            onSubmit={(values) => mutation.mutate(values)}
            submitLabel="Guardar usuario"
            loading={mutation.isPending}
            secondaryLabel="Cancelar"
            onSecondary={() => setSelected(null)}
          />
          {mutation.isError ? <AppText color={colors.error}>{getErrorMessage(mutation.error)}</AppText> : null}
        </Card>
      ) : null}
    </Screen>
  );
}

export function AdminFarmsScreen() {
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["admin_farms"], queryFn: listAllFarms });
  const farms = (query.data ?? []).filter((farm) => `${farm.name} ${farm.department} ${farm.municipality} ${farm.status}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <Screen title="Fincas" subtitle="Consulta informacion general sin editar datos privados sin justificacion.">
      <TextField label="Buscar" placeholder="Nombre, municipio, departamento o estado" value={search} onChangeText={setSearch} />
      {query.isLoading ? <LoadingState title="Cargando fincas" /> : null}
      {query.isError ? <ErrorState title="No pudimos cargar fincas" message={getErrorMessage(query.error)} /> : null}
      <View style={styles.list}>
        {farms.map((farm) => (
          <Card key={farm.id} style={styles.wrap}>
            <AppText variant="subtitle">{farm.name}</AppText>
            <AppText color={colors.mutedText}>
              {farm.department}, {farm.municipality} · {farm.production_type} · {farm.status}
            </AppText>
            <AppText variant="caption">Propietario: {farm.owner_id}</AppText>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

export function AdminSupportScreen() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin_tickets"], queryFn: listAdminTickets });
  const form = useForm<SupportAdminUpdateValues>({
    resolver: formResolver(supportAdminUpdateSchema),
    defaultValues: { assigned_to: "", priority: "medium", status: "open" }
  });
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const mutation = useMutation({
    mutationFn: (values: SupportAdminUpdateValues) => {
      if (!selected) {
        throw new Error("Selecciona un ticket.");
      }
      return updateSupportTicket(selected.id, values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin_tickets"] });
      setSelected(null);
    }
  });

  return (
    <Screen title="Soporte administrativo" subtitle="Asigna, responde y actualiza prioridad o estado.">
      {query.isLoading ? <LoadingState title="Cargando tickets" /> : null}
      {query.isError ? <ErrorState title="No pudimos cargar tickets" message={getErrorMessage(query.error)} /> : null}
      <View style={styles.list}>
        {(query.data ?? []).map((ticket) => (
          <Pressable
            key={ticket.id}
            onPress={() => {
              setSelected(ticket);
              form.reset({ assigned_to: ticket.assigned_to ?? "", priority: ticket.priority, status: ticket.status });
            }}
          >
            <Card style={styles.rowCard}>
              <View style={styles.flex}>
                <AppText variant="subtitle">{ticket.subject}</AppText>
                <AppText color={colors.mutedText}>
                  {ticket.category} · {ticket.priority} · {ticket.status}
                </AppText>
              </View>
              <Button title="Abrir" variant="ghost" onPress={() => router.push(`/(app)/support/${ticket.id}`)} />
            </Card>
          </Pressable>
        ))}
      </View>
      {selected ? (
        <Card style={styles.wrap}>
          <AppText variant="subtitle">Gestionar ticket</AppText>
          <DynamicForm
            form={form}
            fields={[
              { name: "assigned_to", label: "Asignado a", placeholder: "ID del agente" },
              { name: "priority", label: "Prioridad", kind: "choice", options: ticketPriorityOptions },
              { name: "status", label: "Estado", kind: "choice", options: ticketStatusOptions }
            ]}
            onSubmit={(values) => mutation.mutate(values)}
            submitLabel="Actualizar"
            loading={mutation.isPending}
            secondaryLabel="Cancelar"
            onSecondary={() => setSelected(null)}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

export function AdminAnnouncementsScreen() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["announcements"], queryFn: listAnnouncements });
  const form = useForm<AnnouncementValues>({
    resolver: formResolver(announcementSchema),
    defaultValues: {
      title: "",
      body: "",
      target_role: "all",
      farm_id: "",
      user_id: "",
      expires_at: ""
    }
  });
  const mutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["announcements"] });
      form.reset();
    }
  });

  return (
    <Screen title="Avisos" subtitle="Envia comunicaciones internas por rol, finca o usuario.">
      <Card style={styles.wrap}>
        <View style={styles.row}>
          <BellPlus color={colors.forestDark} size={22} />
          <AppText variant="subtitle">Nuevo aviso</AppText>
        </View>
        <DynamicForm
          form={form}
          fields={[
            { name: "title", label: "Titulo" },
            { name: "body", label: "Mensaje", kind: "textarea" },
            {
              name: "target_role",
              label: "Para quien",
              kind: "choice",
              options: [
                { label: "Todos", value: "all" },
                ...roleOptions
              ]
            },
            { name: "farm_id", label: "Finca especifica", placeholder: "Opcional" },
            { name: "user_id", label: "Usuario especifico", placeholder: "Opcional" },
            { name: "expires_at", label: "Vence el", placeholder: "AAAA-MM-DD" }
          ]}
          onSubmit={(values) => mutation.mutate(values)}
          submitLabel="Enviar aviso"
          loading={mutation.isPending}
        />
      </Card>
      {query.isLoading ? <LoadingState title="Cargando avisos" /> : null}
      {(query.data ?? []).length === 0 ? <EmptyState title="Sin avisos" message="Los avisos internos apareceran aqui." /> : null}
      {(query.data ?? []).map((announcement) => (
        <Card key={announcement.id} style={styles.wrap}>
          <AppText variant="subtitle">{announcement.title}</AppText>
          <AppText color={colors.mutedText}>{announcement.body}</AppText>
          <AppText variant="caption">Creado {formatDateTime(announcement.created_at)}</AppText>
        </Card>
      ))}
    </Screen>
  );
}

export function AdminAuditScreen() {
  const query = useQuery({ queryKey: ["audit_logs"], queryFn: listAuditLogs });

  return (
    <Screen title="Auditoria" subtitle="Registros criticos de cambios, bloqueos, roles e inventario.">
      {query.isLoading ? <LoadingState title="Cargando auditoria" /> : null}
      {query.isError ? <ErrorState title="No pudimos cargar auditoria" message={getErrorMessage(query.error)} /> : null}
      {(query.data ?? []).length === 0 ? <EmptyState title="Sin registros" message="Los eventos criticos apareceran cuando ocurran." /> : null}
      <View style={styles.list}>
        {(query.data ?? []).map((log) => (
          <Card key={log.id} style={styles.wrap}>
            <AppText variant="subtitle">{log.action}</AppText>
            <AppText color={colors.mutedText}>
              {log.entity_type} · {log.entity_id ?? "sin entidad"}
            </AppText>
            <AppText variant="caption">{formatDateTime(log.created_at)}</AppText>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  metric: {
    width: 190,
    minHeight: 128,
    gap: spacing.xs
  },
  shortcut: {
    width: 260,
    minHeight: 118,
    gap: spacing.xs
  },
  list: {
    gap: spacing.sm
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  flex: {
    flex: 1
  },
  wrap: {
    gap: spacing.md
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  }
});
