import { toAppError } from "@/lib/errors";
import { getSupabase } from "@/lib/supabase";
import type { SupportAdminUpdateValues, SupportMessageValues, SupportTicketValues } from "@/schemas/forms";
import type { SupportMessage, SupportTicket } from "@/types/domain";

export async function listSupportTickets(): Promise<SupportTicket[]> {
  const { data, error } = await getSupabase()
    .from("support_tickets")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) {
    throw toAppError(error);
  }
  return (data ?? []) as SupportTicket[];
}

export async function getSupportTicket(id: string): Promise<SupportTicket> {
  const { data, error } = await getSupabase().from("support_tickets").select("*").eq("id", id).single();
  if (error) {
    throw toAppError(error);
  }
  return data as SupportTicket;
}

export async function createSupportTicket(values: SupportTicketValues): Promise<SupportTicket> {
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw toAppError(userError, "Inicia sesion para crear un ticket.");
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({ ...values, user_id: userData.user.id })
    .select("*")
    .single();
  if (error) {
    throw toAppError(error);
  }
  return data as SupportTicket;
}

export async function updateSupportTicket(id: string, values: SupportAdminUpdateValues): Promise<SupportTicket> {
  const closed_at = values.status === "closed" ? new Date().toISOString() : null;
  const { data, error } = await getSupabase()
    .from("support_tickets")
    .update({ ...values, closed_at })
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    throw toAppError(error);
  }
  return data as SupportTicket;
}

export async function listSupportMessages(ticketId: string): Promise<SupportMessage[]> {
  const { data, error } = await getSupabase()
    .from("support_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) {
    throw toAppError(error);
  }
  return (data ?? []) as SupportMessage[];
}

export async function createSupportMessage(ticketId: string, values: SupportMessageValues): Promise<SupportMessage> {
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw toAppError(userError, "Inicia sesion para responder el ticket.");
  }

  const { data, error } = await supabase
    .from("support_messages")
    .insert({ ...values, ticket_id: ticketId, sender_id: userData.user.id })
    .select("*")
    .single();
  if (error) {
    throw toAppError(error);
  }
  return data as SupportMessage;
}
