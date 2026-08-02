import type {
  AnimalStatus,
  FarmProductionType,
  FinancialMovementType,
  MovementType,
  ProductStatus,
  Recurrence,
  ReminderStatus,
  TaskPriority,
  TaskStatus,
  TicketPriority,
  TicketStatus,
  UserRole,
  UserStatus
} from "@/types/domain";

export interface Option<T extends string = string> {
  label: string;
  value: T;
}

export const productionTypeOptions: Option<FarmProductionType>[] = [
  { label: "Agricultura", value: "agriculture" },
  { label: "Ganaderia", value: "livestock" },
  { label: "Mixta", value: "mixed" }
];

export const roleOptions: Option<UserRole>[] = [
  { label: "Productor propietario", value: "producer" },
  { label: "Trabajador", value: "worker" },
  { label: "Soporte tecnico", value: "support" },
  { label: "Administrador", value: "admin" }
];

export const userStatusOptions: Option<UserStatus>[] = [
  { label: "Pendiente", value: "pending" },
  { label: "Activo", value: "active" },
  { label: "Bloqueado", value: "blocked" }
];

export const animalStatusOptions: Option<AnimalStatus>[] = [
  { label: "Activo", value: "active" },
  { label: "Vendido", value: "sold" },
  { label: "Fallecido", value: "dead" },
  { label: "Trasladado", value: "transferred" },
  { label: "Inactivo", value: "inactive" }
];

export const sexOptions: Option<"female" | "male" | "unknown">[] = [
  { label: "Hembra", value: "female" },
  { label: "Macho", value: "male" },
  { label: "No especificado", value: "unknown" }
];

export const productStatusOptions: Option<ProductStatus>[] = [
  { label: "Activo", value: "active" },
  { label: "Inactivo", value: "inactive" },
  { label: "Archivado", value: "archived" }
];

export const movementTypeOptions: Option<MovementType>[] = [
  { label: "Entrada", value: "entry" },
  { label: "Salida", value: "exit" },
  { label: "Perdida", value: "loss" },
  { label: "Venta", value: "sale" },
  { label: "Ajuste positivo", value: "adjustment_in" },
  { label: "Ajuste negativo", value: "adjustment_out" }
];

export const taskStatusOptions: Option<TaskStatus>[] = [
  { label: "Pendiente", value: "pending" },
  { label: "En progreso", value: "in_progress" },
  { label: "Completada", value: "completed" },
  { label: "Vencida", value: "overdue" },
  { label: "Cancelada", value: "cancelled" }
];

export const taskPriorityOptions: Option<TaskPriority>[] = [
  { label: "Baja", value: "low" },
  { label: "Media", value: "medium" },
  { label: "Alta", value: "high" },
  { label: "Urgente", value: "urgent" }
];

export const reminderStatusOptions: Option<ReminderStatus>[] = [
  { label: "Pendiente", value: "pending" },
  { label: "Realizado", value: "done" },
  { label: "Cancelado", value: "cancelled" }
];

export const recurrenceOptions: Option<Recurrence>[] = [
  { label: "No se repite", value: "none" },
  { label: "Diario", value: "daily" },
  { label: "Semanal", value: "weekly" },
  { label: "Mensual", value: "monthly" },
  { label: "Anual", value: "yearly" }
];

export const financialTypeOptions: Option<FinancialMovementType>[] = [
  { label: "Ingreso", value: "income" },
  { label: "Gasto", value: "expense" }
];

export const ticketStatusOptions: Option<TicketStatus>[] = [
  { label: "Abierto", value: "open" },
  { label: "Pendiente", value: "pending" },
  { label: "Respondido", value: "answered" },
  { label: "Cerrado", value: "closed" }
];

export const ticketPriorityOptions: Option<TicketPriority>[] = [
  { label: "Baja", value: "low" },
  { label: "Media", value: "medium" },
  { label: "Alta", value: "high" },
  { label: "Urgente", value: "urgent" }
];

export const reminderCategories = [
  "vacunacion",
  "alimentacion",
  "reproduccion",
  "cosecha",
  "mantenimiento",
  "compra",
  "venta",
  "tarea general"
] as const;

export const taskCategories = [
  "ganado",
  "cultivo",
  "inventario",
  "mantenimiento",
  "compra",
  "venta",
  "tarea general"
] as const;

export const financeCategories = [
  "alimentacion",
  "insumos",
  "mano de obra",
  "mantenimiento",
  "transporte",
  "venta",
  "otro"
] as const;
