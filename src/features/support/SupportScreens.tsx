import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { MessageSquare, Plus, Send } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, StyleSheet, View } from "react-native";

import { ErrorState, LoadingState, EmptyState } from "@/components/feedback/States";
import { TextField } from "@/components/forms/TextField";
import { Screen } from "@/components/layout/Screen";
import { AppText } from "@/components/primitives/AppText";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { ticketPriorityOptions, ticketStatusOptions } from "@/constants/catalogs";
import { DynamicForm, type DynamicField } from "@/features/shared/DynamicForm";
import { getErrorMessage } from "@/lib/errors";
import { formResolver } from "@/lib/formResolver";
import { formatDateTime, normalizeSearch } from "@/lib/formatters";
import { useActiveFarm } from "@/providers/ActiveFarmProvider";
import { useAuth } from "@/providers/AuthProvider";
import {
  createSupportMessage,
  createSupportTicket,
  getSupportTicket,
  listSupportMessages,
  listSupportTickets,
  updateSupportTicket
} from "@/repositories/support";
import {
  supportAdminUpdateSchema,
  supportMessageSchema,
  supportTicketSchema,
  type SupportAdminUpdateValues,
  type SupportMessageValues,
  type SupportTicketValues
} from "@/schemas/forms";
import { colors, spacing } from "@/theme/tokens";
import type { SupportTicket } from "@/types/domain";

const ticketFields: DynamicField<SupportTicketValues>[] = [
  { name: "subject", label: "Asunto", placeholder: "Ej. No puedo registrar un animal" },
  { name: "description", label: "Descripcion", placeholder: "Cuenta que paso y que necesitas", kind: "textarea" },
  {
    name: "category",
    label: "Categoria",
    kind: "choice",
    options: [
      { label: "Cuenta", value: "cuenta" },
      { label: "Inventario", value: "inventario" },
      { label: "Reportes", value: "reportes" },
      { label: "Otro", value: "otro" }
    ]
  },
  { name: "priority", label: "Prioridad", kind: "choice", options: ticketPriorityOptions }
];

export function SupportListScreen() {
  const { activeFarmId } = useActiveFarm();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["support_tickets"], queryFn: listSupportTickets });
  const form = useForm<SupportTicketValues>({
    resolver: formResolver(supportTicketSchema),
    defaultValues: {
      farm_id: activeFarmId ?? "",
      subject: "",
      description: "",
      category: "otro",
      priority: "medium"
    }
  });

  const mutation = useMutation({
    mutationFn: (values: SupportTicketValues) => createSupportTicket({ ...values, farm_id: activeFarmId ?? values.farm_id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["support_tickets"] });
      setShowForm(false);
      form.reset();
    }
  });

  const tickets = query.data ?? [];
  const filtered = useMemo(() => {
    const term = normalizeSearch(search);
    if (!term) {
      return tickets;
    }
    return tickets.filter((ticket) => normalizeSearch(`${ticket.subject} ${ticket.category} ${ticket.status}`).includes(term));
  }, [search, tickets]);

  return (
    <Screen title="Soporte" subtitle="Crea solicitudes y conversa con el equipo tecnico.">
      <View style={styles.toolbar}>
        <TextField label="Buscar" placeholder="Asunto, categoria o estado" value={search} onChangeText={setSearch} />
        <Button title="Nuevo ticket" icon={<Plus color={colors.white} size={18} />} onPress={() => setShowForm(true)} />
      </View>
      {showForm ? (
        <Card style={styles.wrap}>
          <AppText variant="subtitle">Nuevo ticket</AppText>
          <DynamicForm
            form={form}
            fields={ticketFields}
            onSubmit={(values) => mutation.mutate(values)}
            submitLabel="Crear ticket"
            loading={mutation.isPending}
            secondaryLabel="Cancelar"
            onSecondary={() => setShowForm(false)}
          />
          {mutation.isError ? <AppText color={colors.error}>{getErrorMessage(mutation.error)}</AppText> : null}
        </Card>
      ) : null}
      {query.isLoading ? <LoadingState title="Cargando soporte" /> : null}
      {query.isError ? <ErrorState title="No pudimos cargar tickets" message={getErrorMessage(query.error)} /> : null}
      {!query.isLoading && filtered.length === 0 ? (
        <EmptyState title="Sin tickets" message="Cuando necesites ayuda, crea una solicitud de soporte." actionLabel="Nuevo ticket" onAction={() => setShowForm(true)} />
      ) : (
        <View style={styles.list}>
          {filtered.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/(app)/support/${ticket.id}`)}>
      <Card style={styles.ticketCard}>
        <MessageSquare color={colors.forestDark} size={24} />
        <View style={styles.ticketText}>
          <AppText variant="subtitle">{ticket.subject}</AppText>
          <AppText color={colors.mutedText}>
            {ticket.category} · {ticketStatusOptions.find((option) => option.value === ticket.status)?.label ?? ticket.status}
          </AppText>
          <AppText variant="caption" color={colors.mutedText}>
            Actualizado {formatDateTime(ticket.updated_at)}
          </AppText>
        </View>
      </Card>
    </Pressable>
  );
}

export function SupportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const isSupportUser = profile?.role === "support" || profile?.role === "admin";
  const queryClient = useQueryClient();
  const ticketQuery = useQuery({ queryKey: ["support_ticket", id], queryFn: () => getSupportTicket(String(id)), enabled: Boolean(id) });
  const messagesQuery = useQuery({ queryKey: ["support_messages", id], queryFn: () => listSupportMessages(String(id)), enabled: Boolean(id) });

  const messageForm = useForm<SupportMessageValues>({
    resolver: formResolver(supportMessageSchema),
    defaultValues: { message: "", attachment_url: "" }
  });
  const adminForm = useForm<SupportAdminUpdateValues>({
    resolver: formResolver(supportAdminUpdateSchema),
    defaultValues: { assigned_to: "", priority: "medium", status: "open" }
  });

  const messageMutation = useMutation({
    mutationFn: (values: SupportMessageValues) => createSupportMessage(String(id), values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["support_messages", id] }),
        queryClient.invalidateQueries({ queryKey: ["support_ticket", id] }),
        queryClient.invalidateQueries({ queryKey: ["support_tickets"] })
      ]);
      messageForm.reset();
    }
  });

  const adminMutation = useMutation({
    mutationFn: (values: SupportAdminUpdateValues) => updateSupportTicket(String(id), values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["support_ticket", id] }),
        queryClient.invalidateQueries({ queryKey: ["support_tickets"] })
      ]);
    }
  });

  const messageFields: DynamicField<SupportMessageValues>[] = [
    { name: "message", label: "Mensaje", placeholder: "Escribe una respuesta clara", kind: "textarea" },
    { name: "attachment_url", label: "Adjunto", placeholder: "URL del adjunto o dejalo vacio" }
  ];
  const adminFields: DynamicField<SupportAdminUpdateValues>[] = [
    { name: "assigned_to", label: "Asignado a", placeholder: "ID de soporte o dejalo vacio" },
    { name: "priority", label: "Prioridad", kind: "choice", options: ticketPriorityOptions },
    { name: "status", label: "Estado", kind: "choice", options: ticketStatusOptions }
  ];

  return (
    <Screen title="Ticket de soporte" subtitle="Conversacion y estado de la solicitud.">
      {ticketQuery.isLoading || messagesQuery.isLoading ? <LoadingState title="Cargando ticket" /> : null}
      {ticketQuery.isError ? <ErrorState title="No pudimos cargar el ticket" message={getErrorMessage(ticketQuery.error)} /> : null}
      {ticketQuery.data ? (
        <Card style={styles.wrap}>
          <AppText variant="title">{ticketQuery.data.subject}</AppText>
          <AppText color={colors.mutedText}>{ticketQuery.data.description}</AppText>
          <AppText variant="caption">
            {ticketQuery.data.category} · {ticketStatusOptions.find((option) => option.value === ticketQuery.data.status)?.label ?? ticketQuery.data.status}
          </AppText>
        </Card>
      ) : null}
      <Card style={styles.wrap}>
        <AppText variant="subtitle">Conversacion</AppText>
        {(messagesQuery.data ?? []).length === 0 ? (
          <AppText color={colors.mutedText}>Aun no hay mensajes.</AppText>
        ) : (
          (messagesQuery.data ?? []).map((message) => (
            <View key={message.id} style={styles.messageBubble}>
              <AppText>{message.message}</AppText>
              <AppText variant="caption" color={colors.mutedText}>
                {formatDateTime(message.created_at)}
              </AppText>
            </View>
          ))
        )}
      </Card>
      <Card style={styles.wrap}>
        <AppText variant="subtitle">Responder</AppText>
        <DynamicForm
          form={messageForm}
          fields={messageFields}
          onSubmit={(values) => messageMutation.mutate(values)}
          submitLabel="Enviar mensaje"
          loading={messageMutation.isPending}
        />
        {messageMutation.isError ? <AppText color={colors.error}>{getErrorMessage(messageMutation.error)}</AppText> : null}
      </Card>
      {isSupportUser ? (
        <Card style={styles.wrap}>
          <AppText variant="subtitle">Gestion de soporte</AppText>
          <DynamicForm
            form={adminForm}
            fields={adminFields}
            onSubmit={(values) => adminMutation.mutate(values)}
            submitLabel="Actualizar ticket"
            loading={adminMutation.isPending}
          />
          {adminMutation.isError ? <AppText color={colors.error}>{getErrorMessage(adminMutation.error)}</AppText> : null}
        </Card>
      ) : (
        <Button
          title="Cerrar ticket"
          variant="secondary"
          icon={<Send color={colors.forestDark} size={18} />}
          onPress={() =>
            adminMutation.mutate({
              assigned_to: ticketQuery.data?.assigned_to ?? "",
              priority: ticketQuery.data?.priority ?? "medium",
              status: "closed"
            })
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md
  },
  toolbar: {
    gap: spacing.sm
  },
  list: {
    gap: spacing.sm
  },
  ticketCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  ticketText: {
    flex: 1,
    gap: spacing.xxs
  },
  messageBubble: {
    backgroundColor: colors.cream,
    borderRadius: 8,
    padding: spacing.sm,
    gap: spacing.xs
  }
});
