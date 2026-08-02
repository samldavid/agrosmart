import { toAppError } from "@/lib/errors";
import { currentMonthRange } from "@/lib/formatters";
import { getSupabase } from "@/lib/supabase";
import type { AdminUserUpdateValues, AnnouncementValues } from "@/schemas/forms";
import type {
  AuditLog,
  DashboardSummary,
  Farm,
  Profile,
  SupportTicket,
  SystemAnnouncement
} from "@/types/domain";

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await getSupabase().from("profiles").select("*").order("created_at", { ascending: false });
  if (error) {
    throw toAppError(error);
  }
  return (data ?? []) as Profile[];
}

export async function updateUserAdmin(userId: string, values: AdminUserUpdateValues): Promise<Profile> {
  const { data, error } = await getSupabase().from("profiles").update(values).eq("id", userId).select("*").single();
  if (error) {
    throw toAppError(error);
  }
  return data as Profile;
}

export async function listAllFarms(): Promise<Farm[]> {
  const { data, error } = await getSupabase().from("farms").select("*").order("created_at", { ascending: false });
  if (error) {
    throw toAppError(error);
  }
  return (data ?? []) as Farm[];
}

export async function createAnnouncement(values: AnnouncementValues): Promise<SystemAnnouncement> {
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw toAppError(userError, "Inicia sesion como administrador.");
  }
  const { data, error } = await supabase
    .from("system_announcements")
    .insert({ ...values, created_by: userData.user.id })
    .select("*")
    .single();
  if (error) {
    throw toAppError(error);
  }
  return data as SystemAnnouncement;
}

export async function listAnnouncements(): Promise<SystemAnnouncement[]> {
  const { data, error } = await getSupabase()
    .from("system_announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    throw toAppError(error);
  }
  return (data ?? []) as SystemAnnouncement[];
}

export async function listAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await getSupabase()
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    throw toAppError(error);
  }
  return (data ?? []) as AuditLog[];
}

export async function getAdminSummary(): Promise<DashboardSummary & { users: number; farms: number }> {
  const supabase = getSupabase();
  const month = currentMonthRange();
  const [
    users,
    activeAnimals,
    products,
    lowStockProducts,
    pendingTasks,
    upcomingReminders,
    openTickets,
    farms,
    finances
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("animals").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("agricultural_products").select("id", { count: "exact", head: true }),
    supabase
      .from("agricultural_products")
      .select("id", { count: "exact", head: true })
      .lte("current_stock", "minimum_stock"),
    supabase.from("tasks").select("id", { count: "exact", head: true }).in("status", ["pending", "in_progress"]),
    supabase
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .gte("reminder_date", new Date().toISOString()),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).neq("status", "closed"),
    supabase.from("farms").select("id", { count: "exact", head: true }),
    supabase
      .from("financial_movements")
      .select("type, amount")
      .gte("transaction_date", month.start)
      .lte("transaction_date", month.end)
  ]);

  const financialRows = (finances.data ?? []) as Array<{ type: "income" | "expense"; amount: number }>;
  return {
    users: users.count ?? 0,
    farms: farms.count ?? 0,
    activeAnimals: activeAnimals.count ?? 0,
    products: products.count ?? 0,
    lowStockProducts: lowStockProducts.count ?? 0,
    pendingTasks: pendingTasks.count ?? 0,
    upcomingReminders: upcomingReminders.count ?? 0,
    openTickets: openTickets.count ?? 0,
    monthIncome: financialRows.filter((row) => row.type === "income").reduce((sum, row) => sum + row.amount, 0),
    monthExpenses: financialRows.filter((row) => row.type === "expense").reduce((sum, row) => sum + row.amount, 0)
  };
}

export async function listAdminTickets(): Promise<SupportTicket[]> {
  const { data, error } = await getSupabase()
    .from("support_tickets")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) {
    throw toAppError(error);
  }
  return (data ?? []) as SupportTicket[];
}
