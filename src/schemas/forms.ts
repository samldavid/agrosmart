import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional();

const requiredText = (label: string) => z.string().trim().min(1, `${label} es obligatorio.`);

const optionalPositiveNumber = z.coerce
  .number({ error: "Ingresa un numero valido." })
  .min(0, "El valor no puede ser negativo.")
  .nullable()
  .optional();

const booleanFromChoice = z.preprocess((value) => value === true || value === "true", z.boolean());

export const signInSchema = z.object({
  email: z.email("Ingresa un correo valido.").trim().toLowerCase(),
  password: z.string().min(6, "La contrasena debe tener minimo 6 caracteres.")
});

export const signUpSchema = signInSchema.extend({
  full_name: requiredText("El nombre"),
  accepted_privacy: z.boolean().refine((value) => value, {
    message: "Debes aceptar la politica de privacidad para continuar."
  })
});

export const recoverPasswordSchema = z.object({
  email: z.email("Ingresa un correo valido.").trim().toLowerCase()
});

export const profileSchema = z.object({
  full_name: requiredText("El nombre"),
  phone: optionalText,
  avatar_url: optionalText
});

export const farmSchema = z.object({
  name: requiredText("El nombre de la finca"),
  description: optionalText,
  production_type: z.enum(["agriculture", "livestock", "mixed"]),
  department: requiredText("El departamento"),
  municipality: requiredText("El municipio"),
  address_description: optionalText,
  area: optionalPositiveNumber,
  area_unit: z.enum(["hectares", "fanegadas", "square_meters"]).default("hectares")
});

export const workerInviteSchema = z.object({
  email: z.email("Ingresa el correo del trabajador.").trim().toLowerCase(),
  role: z.enum(["worker", "manager"]).default("worker"),
  can_manage_inventory: booleanFromChoice.default(false),
  can_report_expenses: booleanFromChoice.default(true),
  can_manage_tasks: booleanFromChoice.default(true)
});

export const animalSchema = z.object({
  identification_code: requiredText("El codigo del animal"),
  name: optionalText,
  species: requiredText("La especie"),
  breed: optionalText,
  sex: z.enum(["female", "male", "unknown"]).default("unknown"),
  birth_date: optionalText,
  acquisition_date: optionalText,
  weight: optionalPositiveNumber,
  weight_unit: z.enum(["kg", "lb"]).default("kg"),
  status: z.enum(["active", "sold", "dead", "transferred", "inactive"]).default("active"),
  photo_url: optionalText,
  notes: optionalText
});

export const productSchema = z.object({
  name: requiredText("El nombre del producto"),
  category: requiredText("La categoria"),
  crop_type: optionalText,
  unit: requiredText("La unidad"),
  current_stock: z.coerce.number({ error: "Ingresa una cantidad valida." }).min(0),
  minimum_stock: z.coerce.number({ error: "Ingresa una cantidad minima valida." }).min(0),
  unit_cost: z.coerce.number({ error: "Ingresa un costo valido." }).min(0),
  sale_price: z.coerce.number({ error: "Ingresa un precio valido." }).min(0),
  image_url: optionalText,
  status: z.enum(["active", "inactive", "archived"]).default("active"),
  notes: optionalText
});

export const inventoryMovementSchema = z.object({
  product_id: requiredText("El producto"),
  movement_type: z.enum(["entry", "exit", "loss", "sale", "adjustment_in", "adjustment_out"]),
  quantity: z.coerce.number({ error: "Ingresa una cantidad valida." }).positive("La cantidad debe ser mayor a cero."),
  unit: requiredText("La unidad"),
  unit_value: z.coerce.number({ error: "Ingresa un valor unitario valido." }).min(0),
  reason: requiredText("La razon"),
  notes: optionalText
});

export const taskSchema = z.object({
  title: requiredText("El titulo"),
  description: optionalText,
  category: requiredText("La categoria"),
  assigned_to: optionalText,
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z.enum(["pending", "in_progress", "completed", "overdue", "cancelled"]).default("pending"),
  due_date: optionalText,
  notes: optionalText
});

export const reminderSchema = z.object({
  title: requiredText("El titulo"),
  description: optionalText,
  category: requiredText("La categoria"),
  related_entity_type: z.enum(["animal", "product", "task", "farm", "ticket", "none"]).default("none"),
  related_entity_id: optionalText,
  reminder_date: requiredText("La fecha del recordatorio"),
  recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).default("none"),
  status: z.enum(["pending", "done", "cancelled"]).default("pending")
});

export const financialMovementSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: requiredText("La categoria"),
  description: requiredText("La descripcion"),
  amount: z.coerce.number({ error: "Ingresa un valor valido." }).positive("El valor debe ser mayor a cero."),
  transaction_date: requiredText("La fecha"),
  related_entity_type: z.enum(["animal", "product", "task", "farm", "ticket", "none"]).default("none"),
  related_entity_id: optionalText,
  receipt_url: optionalText
});

export const supportTicketSchema = z.object({
  farm_id: optionalText,
  subject: requiredText("El asunto"),
  description: requiredText("La descripcion"),
  category: requiredText("La categoria"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium")
});

export const supportMessageSchema = z.object({
  message: requiredText("El mensaje"),
  attachment_url: optionalText
});

export const supportAdminUpdateSchema = z.object({
  assigned_to: optionalText,
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["open", "pending", "answered", "closed"])
});

export const announcementSchema = z.object({
  title: requiredText("El titulo"),
  body: requiredText("El mensaje"),
  target_role: z.enum(["producer", "worker", "support", "admin", "all"]).nullable().default("all"),
  farm_id: optionalText,
  user_id: optionalText,
  expires_at: optionalText
});

export const adminUserUpdateSchema = z.object({
  role: z.enum(["producer", "worker", "support", "admin"]),
  status: z.enum(["pending", "active", "blocked"])
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type RecoverPasswordValues = z.infer<typeof recoverPasswordSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type FarmValues = z.infer<typeof farmSchema>;
export type WorkerInviteValues = z.infer<typeof workerInviteSchema>;
export type AnimalValues = z.infer<typeof animalSchema>;
export type ProductValues = z.infer<typeof productSchema>;
export type InventoryMovementValues = z.infer<typeof inventoryMovementSchema>;
export type TaskValues = z.infer<typeof taskSchema>;
export type ReminderValues = z.infer<typeof reminderSchema>;
export type FinancialMovementValues = z.infer<typeof financialMovementSchema>;
export type SupportTicketValues = z.infer<typeof supportTicketSchema>;
export type SupportMessageValues = z.infer<typeof supportMessageSchema>;
export type SupportAdminUpdateValues = z.infer<typeof supportAdminUpdateSchema>;
export type AnnouncementValues = z.infer<typeof announcementSchema>;
export type AdminUserUpdateValues = z.infer<typeof adminUserUpdateSchema>;
