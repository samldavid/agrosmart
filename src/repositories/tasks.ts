import { toAppError } from "@/lib/errors";
import { getSupabase } from "@/lib/supabase";
import type { ReminderValues, TaskValues } from "@/schemas/forms";
import type { Reminder, Task } from "@/types/domain";

export async function listTasks(farmId: string): Promise<Task[]> {
  const { data, error } = await getSupabase()
    .from("tasks")
    .select("*")
    .eq("farm_id", farmId)
    .order("created_at", { ascending: false });
  if (error) {
    throw toAppError(error);
  }
  return (data ?? []) as Task[];
}

export async function getTask(id: string): Promise<Task> {
  const { data, error } = await getSupabase().from("tasks").select("*").eq("id", id).single();
  if (error) {
    throw toAppError(error);
  }
  return data as Task;
}

export async function createTask(farmId: string, values: TaskValues): Promise<Task> {
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw toAppError(userError, "Inicia sesion para crear tareas.");
  }
  const completed_at = values.status === "completed" ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...values, farm_id: farmId, created_by: userData.user.id, completed_at })
    .select("*")
    .single();
  if (error) {
    throw toAppError(error);
  }
  return data as Task;
}

export async function updateTask(id: string, values: Partial<TaskValues>): Promise<Task> {
  const completed_at = values.status === "completed" ? new Date().toISOString() : values.status ? null : undefined;
  const payload = completed_at === undefined ? values : { ...values, completed_at };
  const { data, error } = await getSupabase().from("tasks").update(payload).eq("id", id).select("*").single();
  if (error) {
    throw toAppError(error);
  }
  return data as Task;
}

export async function listReminders(farmId: string): Promise<Reminder[]> {
  const { data, error } = await getSupabase()
    .from("reminders")
    .select("*")
    .eq("farm_id", farmId)
    .order("reminder_date", { ascending: true });
  if (error) {
    throw toAppError(error);
  }
  return (data ?? []) as Reminder[];
}

export async function createReminder(farmId: string, values: ReminderValues): Promise<Reminder> {
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw toAppError(userError, "Inicia sesion para crear recordatorios.");
  }
  const { data, error } = await supabase
    .from("reminders")
    .insert({ ...values, farm_id: farmId, created_by: userData.user.id })
    .select("*")
    .single();
  if (error) {
    throw toAppError(error);
  }
  return data as Reminder;
}

export async function updateReminder(id: string, values: Partial<ReminderValues>): Promise<Reminder> {
  const { data, error } = await getSupabase().from("reminders").update(values).eq("id", id).select("*").single();
  if (error) {
    throw toAppError(error);
  }
  return data as Reminder;
}
