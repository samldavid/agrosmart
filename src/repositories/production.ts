import { toAppError } from "@/lib/errors";
import { getSupabase } from "@/lib/supabase";
import type { AnimalValues, InventoryMovementValues, ProductValues } from "@/schemas/forms";
import type { AgriculturalProduct, Animal, InventoryMovement } from "@/types/domain";

export async function listAnimals(farmId: string): Promise<Animal[]> {
  const { data, error } = await getSupabase()
    .from("animals")
    .select("*")
    .eq("farm_id", farmId)
    .order("created_at", { ascending: false });
  if (error) {
    throw toAppError(error);
  }
  return (data ?? []) as Animal[];
}

export async function getAnimal(id: string): Promise<Animal> {
  const { data, error } = await getSupabase().from("animals").select("*").eq("id", id).single();
  if (error) {
    throw toAppError(error);
  }
  return data as Animal;
}

export async function createAnimal(farmId: string, values: AnimalValues): Promise<Animal> {
  const { data, error } = await getSupabase()
    .from("animals")
    .insert({ ...values, farm_id: farmId })
    .select("*")
    .single();
  if (error) {
    throw toAppError(error);
  }
  return data as Animal;
}

export async function updateAnimal(id: string, values: Partial<AnimalValues>): Promise<Animal> {
  const { data, error } = await getSupabase().from("animals").update(values).eq("id", id).select("*").single();
  if (error) {
    throw toAppError(error);
  }
  return data as Animal;
}

export async function listProducts(farmId: string): Promise<AgriculturalProduct[]> {
  const { data, error } = await getSupabase()
    .from("agricultural_products")
    .select("*")
    .eq("farm_id", farmId)
    .order("created_at", { ascending: false });
  if (error) {
    throw toAppError(error);
  }
  return (data ?? []) as AgriculturalProduct[];
}

export async function getProduct(id: string): Promise<AgriculturalProduct> {
  const { data, error } = await getSupabase().from("agricultural_products").select("*").eq("id", id).single();
  if (error) {
    throw toAppError(error);
  }
  return data as AgriculturalProduct;
}

export async function createProduct(farmId: string, values: ProductValues): Promise<AgriculturalProduct> {
  const { data, error } = await getSupabase()
    .from("agricultural_products")
    .insert({ ...values, farm_id: farmId })
    .select("*")
    .single();
  if (error) {
    throw toAppError(error);
  }
  return data as AgriculturalProduct;
}

export async function updateProduct(id: string, values: Partial<ProductValues>): Promise<AgriculturalProduct> {
  const { data, error } = await getSupabase()
    .from("agricultural_products")
    .update(values)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    throw toAppError(error);
  }
  return data as AgriculturalProduct;
}

export async function listInventoryMovements(farmId: string, productId?: string): Promise<InventoryMovement[]> {
  let query = getSupabase()
    .from("inventory_movements")
    .select("*")
    .eq("farm_id", farmId)
    .order("created_at", { ascending: false });

  if (productId) {
    query = query.eq("entity_id", productId);
  }

  const { data, error } = await query;
  if (error) {
    throw toAppError(error);
  }
  return (data ?? []) as InventoryMovement[];
}

export async function recordInventoryMovement(
  farmId: string,
  values: InventoryMovementValues
): Promise<InventoryMovement> {
  const { data, error } = await getSupabase().rpc("record_inventory_movement", {
    p_farm_id: farmId,
    p_product_id: values.product_id,
    p_movement_type: values.movement_type,
    p_quantity: values.quantity,
    p_unit: values.unit,
    p_unit_value: values.unit_value,
    p_reason: values.reason,
    p_notes: values.notes
  });
  if (error) {
    throw toAppError(error);
  }
  return data as InventoryMovement;
}
