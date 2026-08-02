import { toAppError } from "@/lib/errors";
import { getSupabase } from "@/lib/supabase";
import type { FarmValues, WorkerInviteValues } from "@/schemas/forms";
import type { Farm, FarmMember } from "@/types/domain";

export async function listFarms(): Promise<Farm[]> {
  const { data, error } = await getSupabase().from("farms").select("*").order("created_at", { ascending: true });
  if (error) {
    throw toAppError(error);
  }
  return (data ?? []) as Farm[];
}

export async function createFarm(values: FarmValues): Promise<Farm> {
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw toAppError(userError, "Inicia sesion para crear una finca.");
  }

  const { data, error } = await supabase
    .from("farms")
    .insert({ ...values, owner_id: userData.user.id })
    .select("*")
    .single();

  if (error) {
    throw toAppError(error);
  }
  return data as Farm;
}

export async function updateFarm(farmId: string, values: FarmValues): Promise<Farm> {
  const { data, error } = await getSupabase().from("farms").update(values).eq("id", farmId).select("*").single();
  if (error) {
    throw toAppError(error);
  }
  return data as Farm;
}

export async function listFarmMembers(farmId: string): Promise<FarmMember[]> {
  const { data, error } = await getSupabase()
    .from("farm_members")
    .select("*")
    .eq("farm_id", farmId)
    .order("created_at", { ascending: false });
  if (error) {
    throw toAppError(error);
  }
  return (data ?? []) as FarmMember[];
}

export async function inviteFarmMember(farmId: string, values: WorkerInviteValues): Promise<FarmMember> {
  const { data, error } = await getSupabase().rpc("invite_farm_member", {
    p_farm_id: farmId,
    p_email: values.email,
    p_role: values.role,
    p_permissions: {
      "inventory.manage": values.can_manage_inventory,
      "inventory.movements": values.can_manage_inventory,
      "finances.report_expense": values.can_report_expenses,
      "tasks.manage": values.can_manage_tasks
    }
  });
  if (error) {
    throw toAppError(error);
  }
  return data as FarmMember;
}
