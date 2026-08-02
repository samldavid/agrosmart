import { toAppError } from "@/lib/errors";
import { getSupabase } from "@/lib/supabase";
import type { FinancialMovementValues } from "@/schemas/forms";
import type { FinancialMovement } from "@/types/domain";

export async function listFinancialMovements(farmId: string): Promise<FinancialMovement[]> {
  const { data, error } = await getSupabase()
    .from("financial_movements")
    .select("*")
    .eq("farm_id", farmId)
    .order("transaction_date", { ascending: false });
  if (error) {
    throw toAppError(error);
  }
  return (data ?? []) as FinancialMovement[];
}

export async function createFinancialMovement(
  farmId: string,
  values: FinancialMovementValues
): Promise<FinancialMovement> {
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw toAppError(userError, "Inicia sesion para registrar movimientos financieros.");
  }

  const { data, error } = await supabase
    .from("financial_movements")
    .insert({ ...values, farm_id: farmId, created_by: userData.user.id })
    .select("*")
    .single();
  if (error) {
    throw toAppError(error);
  }
  return data as FinancialMovement;
}
