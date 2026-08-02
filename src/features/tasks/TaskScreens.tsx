import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { CalendarDays, CheckCircle2, Clock3, Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { ErrorState, LoadingState, EmptyState } from "@/components/feedback/States";
import { TextField } from "@/components/forms/TextField";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/primitives/AppText";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import {
  recurrenceOptions,
  reminderCategories,
  reminderStatusOptions,
  taskCategories,
  taskPriorityOptions,
  taskStatusOptions
} from "@/constants/catalogs";
import { CrudScreen, type CrudScreenConfig } from "@/features/shared/CrudScreen";
import { DynamicForm, type DynamicField } from "@/features/shared/DynamicForm";
import { NoFarmCard } from "@/features/shared/NoFarmCard";
import { getErrorMessage } from "@/lib/errors";
import { formResolver } from "@/lib/formResolver";
import { formatDate, normalizeSearch } from "@/lib/formatters";
import { useActiveFarm } from "@/providers/ActiveFarmProvider";
import { listFarmMembers } from "@/repositories/farms";
import {
  createReminder,
  createTask,
  getTask,
  listReminders,
  listTasks,
  updateReminder,
  updateTask
} from "@/repositories/tasks";
import { reminderSchema, taskSchema, type ReminderValues, type TaskValues } from "@/schemas/forms";
import { colors, spacing } from "@/theme/tokens";
import type { Reminder, Task, TaskStatus } from "@/types/domain";

export function TasksScreen() {
  const { activeFarmId } = useActiveFarm();
  const membersQuery = useQuery({
    queryKey: ["farm_members", activeFarmId],
    queryFn: () => listFarmMembers(activeFarmId ?? ""),
    enabled: Boolean(activeFarmId)
  });

  const assigneeOptions = [
    { label: "Sin asignar", value: "" },
    ...(membersQuery.data ?? []).map((member) => ({
      label: member.invited_email ?? member.user_id ?? "Trabajador",
      value: member.user_id ?? ""
    }))
  ];

  const taskFields: DynamicField<TaskValues>[] = [
    { name: "title", label: "Titulo", placeholder: "Ej. Revisar cerca del potrero" },
    { name: "description", label: "Descripcion", placeholder: "Detalles de la tarea", kind: "textarea" },
    {
      name: "category",
      label: "Categoria",
      kind: "choice",
      options: taskCategories.map((category) => ({ label: category, value: category }))
    },
    { name: "assigned_to", label: "Responsable", kind: "choice", options: assigneeOptions },
    { name: "priority", label: "Prioridad", kind: "choice", options: taskPriorityOptions },
    { name: "status", label: "Estado", kind: "choice", options: taskStatusOptions },
    { name: "due_date", label: "Fecha limite", placeholder: "AAAA-MM-DD", kind: "date" },
    { name: "notes", label: "Comentarios u observaciones", placeholder: "Notas de avance", kind: "textarea" }
  ];

  const config: CrudScreenConfig<TaskValues, Task> = {
    title: "Tareas",
    subtitle: "Crea, asigna, filtra y actualiza el trabajo diario.",
    emptyTitle: "Sin tareas",
    emptyMessage: "Crea tareas para organizar la jornada de la finca.",
    queryKey: "tasks",
    fields: taskFields,
    schema: taskSchema,
    defaultValues: {
      title: "",
      description: "",
      category: "tarea general",
      assigned_to: "",
      priority: "medium",
      status: "pending",
      due_date: "",
      notes: ""
    },
    list: listTasks,
    create: createTask,
    update: updateTask,
    getId: (record) => record.id,
    toItem: (record) => ({
      title: record.title,
      subtitle: `${record.category} · ${taskStatusOptions.find((option) => option.value === record.status)?.label ?? record.status}`,
      meta: `Prioridad: ${taskPriorityOptions.find((option) => option.value === record.priority)?.label ?? record.priority} · Limite: ${formatDate(record.due_date)}`,
      badge: taskStatusOptions.find((option) => option.value === record.status)?.label ?? record.status
    }),
    toFormValues: (record) => ({
      title: record.title,
      description: record.description ?? "",
      category: record.category,
      assigned_to: record.assigned_to ?? "",
      priority: record.priority,
      status: record.status,
      due_date: record.due_date ?? "",
      notes: record.notes ?? ""
    }),
    searchableText: (record) => `${record.title} ${record.category} ${record.status} ${record.priority}`,
    onOpenDetail: (record) => router.push(`/(app)/tasks/${record.id}`)
  };

  return (
    <Screen title={config.title} subtitle={config.subtitle}>
      <CrudScreen config={config} />
    </Screen>
  );
}

export function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["task", id], queryFn: () => getTask(String(id)), enabled: Boolean(id) });
  const mutation = useMutation({
    mutationFn: (status: TaskStatus) => updateTask(String(id), { status }),
    onSuccess: async (task) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["task", id] }),
        queryClient.invalidateQueries({ queryKey: ["tasks", task.farm_id] })
      ]);
    }
  });

  return (
    <Screen title="Detalle de tarea" subtitle="Actualiza el estado y revisa comentarios.">
      {query.isLoading ? <LoadingState title="Cargando tarea" /> : null}
      {query.isError ? <ErrorState title="No pudimos cargar la tarea" message={getErrorMessage(query.error)} /> : null}
      {query.data ? (
        <Card style={styles.wrap}>
          <AppText variant="title">{query.data.title}</AppText>
          <AppText color={colors.mutedText}>{query.data.description ?? "Sin descripcion"}</AppText>
          <DetailLine label="Categoria" value={query.data.category} />
          <DetailLine label="Prioridad" value={taskPriorityOptions.find((option) => option.value === query.data.priority)?.label ?? query.data.priority} />
          <DetailLine label="Estado" value={taskStatusOptions.find((option) => option.value === query.data.status)?.label ?? query.data.status} />
          <DetailLine label="Fecha limite" value={formatDate(query.data.due_date)} />
          <DetailLine label="Comentarios" value={query.data.notes ?? "Sin comentarios"} />
          <View style={styles.actionRow}>
            <Button title="En progreso" variant="secondary" onPress={() => mutation.mutate("in_progress")} loading={mutation.isPending} />
            <Button title="Completar" onPress={() => mutation.mutate("completed")} loading={mutation.isPending} />
            <Button title="Cancelar" variant="ghost" onPress={() => mutation.mutate("cancelled")} loading={mutation.isPending} />
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

export function RemindersScreen() {
  const { activeFarmId } = useActiveFarm();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["reminders", activeFarmId],
    queryFn: () => listReminders(activeFarmId ?? ""),
    enabled: Boolean(activeFarmId)
  });

  const form = useForm<ReminderValues>({
    resolver: formResolver(reminderSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "tarea general",
      related_entity_type: "none",
      related_entity_id: "",
      reminder_date: new Date().toISOString().slice(0, 10),
      recurrence: "none",
      status: "pending"
    }
  });

  const fields: DynamicField<ReminderValues>[] = [
    { name: "title", label: "Titulo", placeholder: "Ej. Vacunar lote joven" },
    { name: "description", label: "Descripcion", kind: "textarea", placeholder: "Detalles del recordatorio" },
    {
      name: "category",
      label: "Categoria",
      kind: "choice",
      options: reminderCategories.map((category) => ({ label: category, value: category }))
    },
    { name: "reminder_date", label: "Fecha", kind: "date", placeholder: "AAAA-MM-DD" },
    { name: "recurrence", label: "Repeticion", kind: "choice", options: recurrenceOptions },
    { name: "status", label: "Estado", kind: "choice", options: reminderStatusOptions },
    {
      name: "related_entity_type",
      label: "Relacionado con",
      kind: "choice",
      options: [
        { label: "Ninguno", value: "none" },
        { label: "Animal", value: "animal" },
        { label: "Producto", value: "product" },
        { label: "Tarea", value: "task" },
        { label: "Finca", value: "farm" }
      ]
    },
    { name: "related_entity_id", label: "ID relacionado", placeholder: "Opcional" }
  ];

  const createMutation = useMutation({
    mutationFn: (values: ReminderValues) => {
      if (!activeFarmId) {
        throw new Error("Selecciona una finca.");
      }
      return createReminder(activeFarmId, values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reminders", activeFarmId] });
      setShowForm(false);
      form.reset();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<ReminderValues> }) => updateReminder(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reminders", activeFarmId] });
    }
  });

  const reminders = query.data ?? [];
  const filtered = useMemo(() => {
    const term = normalizeSearch(search);
    if (!term) {
      return reminders;
    }
    return reminders.filter((reminder) => normalizeSearch(`${reminder.title} ${reminder.category} ${reminder.status}`).includes(term));
  }, [reminders, search]);

  const days = useMemo(() => {
    const groups = new Map<string, Reminder[]>();
    for (const reminder of filtered) {
      const day = reminder.reminder_date.slice(0, 10);
      groups.set(day, [...(groups.get(day) ?? []), reminder]);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  if (!activeFarmId) {
    return (
      <Screen title="Recordatorios" subtitle="Calendario de actividades importantes.">
        <NoFarmCard />
      </Screen>
    );
  }

  return (
    <Screen title="Recordatorios" subtitle="Calendario mensual, proximos eventos y recurrencias basicas.">
      <View style={styles.wrap}>
        <View style={styles.toolbar}>
          <TextField label="Buscar" placeholder="Titulo, categoria o estado" value={search} onChangeText={setSearch} />
          <Button title="Nuevo recordatorio" icon={<Plus color={colors.white} size={18} />} onPress={() => setShowForm(true)} />
        </View>
        {showForm ? (
          <Card style={styles.wrap}>
            <AppText variant="subtitle">Crear recordatorio</AppText>
            <DynamicForm
              form={form}
              fields={fields}
              onSubmit={(values) => createMutation.mutate(values)}
              submitLabel="Guardar recordatorio"
              loading={createMutation.isPending}
              secondaryLabel="Cancelar"
              onSecondary={() => setShowForm(false)}
            />
            {createMutation.isError ? <AppText color={colors.error}>{getErrorMessage(createMutation.error)}</AppText> : null}
          </Card>
        ) : null}
        {query.isLoading ? <LoadingState title="Cargando recordatorios" /> : null}
        {query.isError ? <ErrorState title="No pudimos cargar recordatorios" message={getErrorMessage(query.error)} /> : null}
        {!query.isLoading && filtered.length === 0 ? (
          <EmptyState title="Sin recordatorios" message="Programa vacunacion, alimentacion, cosechas o mantenimientos." actionLabel="Nuevo recordatorio" onAction={() => setShowForm(true)} />
        ) : (
          <View style={styles.calendar}>
            {days.map(([day, items]) => (
              <Card key={day} style={styles.wrap}>
                <View style={styles.row}>
                  <CalendarDays color={colors.forestDark} size={20} />
                  <AppText variant="subtitle">{formatDate(day)}</AppText>
                </View>
                {items.map((item) => (
                  <View key={item.id} style={styles.reminderItem}>
                    <View style={styles.reminderText}>
                      <AppText variant="bodyMedium">{item.title}</AppText>
                      <AppText variant="caption" color={colors.mutedText}>
                        {item.category} · {reminderStatusOptions.find((option) => option.value === item.status)?.label ?? item.status}
                      </AppText>
                    </View>
                    <Button title="Realizado" variant="secondary" onPress={() => updateMutation.mutate({ id: item.id, values: { status: "done" } })} />
                  </View>
                ))}
              </Card>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <AppText variant="label">{label}</AppText>
      <AppText color={colors.mutedText}>{value}</AppText>
    </View>
  );
}

export function TaskQuickStats() {
  return (
    <View style={styles.quickStats}>
      <Clock3 color={colors.olive} size={18} />
      <AppText variant="caption" color={colors.mutedText}>
        Las tareas vencidas pueden marcarse desde filtros o al revisar la fecha limite.
      </AppText>
      <CheckCircle2 color={colors.success} size={18} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md
  },
  toolbar: {
    gap: spacing.sm
  },
  calendar: {
    gap: spacing.sm
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  reminderItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  reminderText: {
    flex: 1
  },
  detailLine: {
    gap: spacing.xxs
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  quickStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  }
});
