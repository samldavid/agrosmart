export type UserRole = "producer" | "worker" | "support" | "admin";
export type UserStatus = "pending" | "active" | "blocked";
export type FarmProductionType = "agriculture" | "livestock" | "mixed";
export type FarmMemberRole = "owner" | "worker" | "manager";
export type FarmMemberStatus = "pending" | "active" | "blocked";
export type AnimalStatus = "active" | "sold" | "dead" | "transferred" | "inactive";
export type ProductStatus = "active" | "inactive" | "archived";
export type MovementType = "entry" | "exit" | "loss" | "sale" | "adjustment_in" | "adjustment_out";
export type EntityType = "animal" | "product" | "task" | "farm" | "ticket" | "none";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue" | "cancelled";
export type ReminderStatus = "pending" | "done" | "cancelled";
export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type FinancialMovementType = "income" | "expense";
export type TicketStatus = "open" | "pending" | "answered" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type NotificationType = "system" | "task" | "reminder" | "support" | "inventory";

export interface BaseRow {
  id: string;
  created_at: string;
}

export interface Profile extends BaseRow {
  email: string | null;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  updated_at: string;
}

export interface Farm extends BaseRow {
  owner_id: string;
  name: string;
  description: string | null;
  production_type: FarmProductionType;
  department: string;
  municipality: string;
  address_description: string | null;
  area: number | null;
  area_unit: "hectares" | "fanegadas" | "square_meters";
  status: "active" | "blocked" | "archived";
  updated_at: string;
}

export interface FarmMember extends BaseRow {
  farm_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: FarmMemberRole;
  permissions: Record<string, boolean>;
  status: FarmMemberStatus;
}

export interface Animal extends BaseRow {
  farm_id: string;
  identification_code: string;
  name: string | null;
  species: string;
  breed: string | null;
  sex: "female" | "male" | "unknown";
  birth_date: string | null;
  acquisition_date: string | null;
  weight: number | null;
  weight_unit: "kg" | "lb";
  status: AnimalStatus;
  photo_url: string | null;
  notes: string | null;
  updated_at: string;
}

export interface AgriculturalProduct extends BaseRow {
  farm_id: string;
  name: string;
  category: string;
  crop_type: string | null;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  unit_cost: number;
  sale_price: number;
  image_url: string | null;
  status: ProductStatus;
  notes: string | null;
  updated_at: string;
}

export interface InventoryMovement extends BaseRow {
  farm_id: string;
  entity_type: "product" | "animal";
  entity_id: string;
  movement_type: MovementType;
  quantity: number;
  unit: string;
  unit_value: number;
  total_value: number;
  reason: string;
  notes: string | null;
  performed_by: string;
}

export interface Task extends BaseRow {
  farm_id: string;
  title: string;
  description: string | null;
  category: string;
  assigned_to: string | null;
  created_by: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  updated_at: string;
}

export interface Reminder extends BaseRow {
  farm_id: string;
  title: string;
  description: string | null;
  category: string;
  related_entity_type: EntityType;
  related_entity_id: string | null;
  reminder_date: string;
  recurrence: Recurrence;
  status: ReminderStatus;
  created_by: string;
}

export interface FinancialMovement extends BaseRow {
  farm_id: string;
  type: FinancialMovementType;
  category: string;
  description: string;
  amount: number;
  transaction_date: string;
  related_entity_type: EntityType;
  related_entity_id: string | null;
  receipt_url: string | null;
  created_by: string;
}

export interface SupportTicket extends BaseRow {
  user_id: string;
  farm_id: string | null;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to: string | null;
  updated_at: string;
  closed_at: string | null;
}

export interface SupportMessage extends BaseRow {
  ticket_id: string;
  sender_id: string;
  message: string;
  attachment_url: string | null;
}

export interface Notification extends BaseRow {
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  related_entity_type: EntityType;
  related_entity_id: string | null;
  read_at: string | null;
}

export interface AuditLog extends BaseRow {
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
}

export interface SystemAnnouncement extends BaseRow {
  title: string;
  body: string;
  target_role: UserRole | "all" | null;
  farm_id: string | null;
  user_id: string | null;
  created_by: string;
  expires_at: string | null;
}

export interface DashboardSummary {
  activeAnimals: number;
  products: number;
  lowStockProducts: number;
  pendingTasks: number;
  upcomingReminders: number;
  monthExpenses: number;
  monthIncome: number;
  openTickets: number;
}
