import { toAppError } from "@/lib/errors";
import { currentMonthRange } from "@/lib/formatters";
import { getSupabase } from "@/lib/supabase";
import type { DashboardSummary } from "@/types/domain";

export async function getDashboardSummary(farmId: string): Promise<DashboardSummary> {
  const supabase = getSupabase();
  const month = currentMonthRange();
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate() + 1).toISOString();

  const [
    activeAnimals,
    products,
    lowStockProducts,
    pendingTasks,
    upcomingReminders,
    openTickets,
    finances
  ] = await Promise.all([
    supabase.from("animals").select("id", { count: "exact", head: true }).eq("farm_id", farmId).eq("status", "active"),
    supabase.from("agricultural_products").select("id", { count: "exact", head: true }).eq("farm_id", farmId),
    supabase
      .from("agricultural_products")
      .select("id", { count: "exact", head: true })
      .eq("farm_id", farmId)
      .lte("current_stock", "minimum_stock"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("farm_id", farmId)
      .in("status", ["pending", "in_progress", "overdue"]),
    supabase
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .eq("farm_id", farmId)
      .eq("status", "pending")
      .gte("reminder_date", now.toISOString())
      .lte("reminder_date", nextMonth),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("farm_id", farmId).neq("status", "closed"),
    supabase
      .from("financial_movements")
      .select("type, amount")
      .eq("farm_id", farmId)
      .gte("transaction_date", month.start)
      .lte("transaction_date", month.end)
  ]);

  const possibleErrors = [
    activeAnimals.error,
    products.error,
    lowStockProducts.error,
    pendingTasks.error,
    upcomingReminders.error,
    openTickets.error,
    finances.error
  ].filter(Boolean);

  if (possibleErrors[0]) {
    throw toAppError(possibleErrors[0]);
  }

  const financialRows = (finances.data ?? []) as Array<{ type: "income" | "expense"; amount: number }>;

  return {
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
