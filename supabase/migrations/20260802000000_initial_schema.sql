create extension if not exists pgcrypto;

create schema if not exists app_private;

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  phone text,
  avatar_url text,
  role text not null default 'producer' check (role in ('producer', 'worker', 'support', 'admin')),
  status text not null default 'active' check (status in ('pending', 'active', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  description text,
  production_type text not null check (production_type in ('agriculture', 'livestock', 'mixed')),
  department text not null,
  municipality text not null,
  address_description text,
  area numeric(12,2) check (area is null or area >= 0),
  area_unit text not null default 'hectares' check (area_unit in ('hectares', 'fanegadas', 'square_meters')),
  status text not null default 'active' check (status in ('active', 'blocked', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.farm_members (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  invited_email text,
  role text not null default 'worker' check (role in ('owner', 'worker', 'manager')),
  permissions jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'active', 'blocked')),
  created_at timestamptz not null default now(),
  constraint farm_members_user_or_invite check (user_id is not null or invited_email is not null)
);

create table public.animals (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  identification_code text not null,
  name text,
  species text not null,
  breed text,
  sex text not null default 'unknown' check (sex in ('female', 'male', 'unknown')),
  birth_date date,
  acquisition_date date,
  weight numeric(12,2) check (weight is null or weight >= 0),
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  status text not null default 'active' check (status in ('active', 'sold', 'dead', 'transferred', 'inactive')),
  photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (farm_id, identification_code)
);

create table public.agricultural_products (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  category text not null,
  crop_type text,
  unit text not null,
  current_stock numeric(14,2) not null default 0 check (current_stock >= 0),
  minimum_stock numeric(14,2) not null default 0 check (minimum_stock >= 0),
  unit_cost numeric(14,2) not null default 0 check (unit_cost >= 0),
  sale_price numeric(14,2) not null default 0 check (sale_price >= 0),
  image_url text,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (farm_id, name)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  entity_type text not null check (entity_type in ('product', 'animal')),
  entity_id uuid not null,
  movement_type text not null check (movement_type in ('entry', 'exit', 'loss', 'sale', 'adjustment_in', 'adjustment_out')),
  quantity numeric(14,2) not null check (quantity > 0),
  unit text not null,
  unit_value numeric(14,2) not null default 0 check (unit_value >= 0),
  total_value numeric(14,2) not null default 0 check (total_value >= 0),
  reason text not null,
  notes text,
  performed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
  due_date date,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  title text not null,
  description text,
  category text not null check (category in ('vacunacion', 'alimentacion', 'reproduccion', 'cosecha', 'mantenimiento', 'compra', 'venta', 'tarea general')),
  related_entity_type text not null default 'none' check (related_entity_type in ('animal', 'product', 'task', 'farm', 'ticket', 'none')),
  related_entity_id uuid,
  reminder_date timestamptz not null,
  recurrence text not null default 'none' check (recurrence in ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  status text not null default 'pending' check (status in ('pending', 'done', 'cancelled')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.financial_movements (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  transaction_date date not null,
  related_entity_type text not null default 'none' check (related_entity_type in ('animal', 'product', 'task', 'farm', 'ticket', 'none')),
  related_entity_id uuid,
  receipt_url text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  farm_id uuid references public.farms(id) on delete set null,
  subject text not null,
  description text not null,
  category text not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'pending', 'answered', 'closed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  message text not null,
  attachment_url text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'system' check (type in ('system', 'task', 'reminder', 'support', 'inventory')),
  related_entity_type text not null default 'none' check (related_entity_type in ('animal', 'product', 'task', 'farm', 'ticket', 'none')),
  related_entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.system_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target_role text check (target_role in ('producer', 'worker', 'support', 'admin', 'all')),
  farm_id uuid references public.farms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles for each row execute function app_private.set_updated_at();
create trigger farms_set_updated_at before update on public.farms for each row execute function app_private.set_updated_at();
create trigger animals_set_updated_at before update on public.animals for each row execute function app_private.set_updated_at();
create trigger products_set_updated_at before update on public.agricultural_products for each row execute function app_private.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks for each row execute function app_private.set_updated_at();
create trigger tickets_set_updated_at before update on public.support_tickets for each row execute function app_private.set_updated_at();

create index profiles_role_status_idx on public.profiles (role, status);
create index farms_owner_id_idx on public.farms (owner_id);
create index farms_status_idx on public.farms (status);
create index farm_members_farm_id_idx on public.farm_members (farm_id);
create index farm_members_user_id_idx on public.farm_members (user_id);
create unique index farm_members_farm_user_unique on public.farm_members (farm_id, user_id) where user_id is not null;
create unique index farm_members_farm_email_unique on public.farm_members (farm_id, lower(invited_email)) where invited_email is not null;
create index animals_farm_status_idx on public.animals (farm_id, status);
create index products_farm_status_idx on public.agricultural_products (farm_id, status);
create index products_low_stock_idx on public.agricultural_products (farm_id, current_stock, minimum_stock) where status = 'active';
create index inventory_movements_farm_created_idx on public.inventory_movements (farm_id, created_at desc);
create index inventory_movements_entity_idx on public.inventory_movements (entity_type, entity_id);
create index tasks_farm_status_idx on public.tasks (farm_id, status);
create index tasks_assigned_to_idx on public.tasks (assigned_to);
create index reminders_farm_date_idx on public.reminders (farm_id, reminder_date);
create index financial_movements_farm_date_idx on public.financial_movements (farm_id, transaction_date desc);
create index support_tickets_user_idx on public.support_tickets (user_id);
create index support_tickets_farm_idx on public.support_tickets (farm_id);
create index support_tickets_status_idx on public.support_tickets (status);
create index support_messages_ticket_idx on public.support_messages (ticket_id, created_at);
create index notifications_user_read_idx on public.notifications (user_id, read_at);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create or replace function app_private.current_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = (select auth.uid()) and status = 'active'
$$;

create or replace function app_private.is_active()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and status = 'active')
$$;

create or replace function app_private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select app_private.current_role() = 'admin'
$$;

create or replace function app_private.is_support()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select app_private.current_role() in ('support', 'admin')
$$;

create or replace function app_private.is_farm_owner(p_farm_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.farms
    where id = p_farm_id
      and owner_id = (select auth.uid())
      and status <> 'blocked'
  )
$$;

create or replace function app_private.is_farm_member(p_farm_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select app_private.is_farm_owner(p_farm_id)
    or exists (
      select 1 from public.farm_members
      where farm_id = p_farm_id
        and user_id = (select auth.uid())
        and status = 'active'
    )
$$;

create or replace function app_private.can_manage_farm(p_farm_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select app_private.is_admin()
    or app_private.is_farm_owner(p_farm_id)
    or exists (
      select 1 from public.farm_members
      where farm_id = p_farm_id
        and user_id = (select auth.uid())
        and role = 'manager'
        and status = 'active'
    )
$$;

create or replace function app_private.can_access_ticket(p_ticket_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select app_private.is_support()
    or exists (
      select 1 from public.support_tickets t
      where t.id = p_ticket_id
        and (
          t.user_id = (select auth.uid())
          or (t.farm_id is not null and app_private.is_farm_member(t.farm_id))
        )
    )
$$;

create or replace function app_private.audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    (select auth.uid()),
    tg_op || '_' || tg_table_name,
    tg_table_name,
    coalesce(new.id, old.id),
    jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_profile_changes after update on public.profiles for each row
when (old.role is distinct from new.role or old.status is distinct from new.status)
execute function app_private.audit_event();
create trigger audit_farm_changes after update on public.farms for each row
when (old.status is distinct from new.status)
execute function app_private.audit_event();
create trigger audit_product_changes after update on public.agricultural_products for each row
when (old.current_stock is distinct from new.current_stock or old.status is distinct from new.status)
execute function app_private.audit_event();
create trigger audit_ticket_changes after update on public.support_tickets for each row
when (old.status is distinct from new.status or old.priority is distinct from new.priority or old.assigned_to is distinct from new.assigned_to)
execute function app_private.audit_event();

create or replace function app_private.guard_profile_role_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (old.role is distinct from new.role or old.status is distinct from new.status) and not app_private.is_admin() then
    raise exception 'Solo un administrador puede cambiar roles o estado de cuenta.';
  end if;
  return new;
end;
$$;

create trigger guard_profile_role_status before update on public.profiles
for each row execute function app_private.guard_profile_role_status();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'producer',
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.record_inventory_movement(
  p_farm_id uuid,
  p_product_id uuid,
  p_movement_type text,
  p_quantity numeric,
  p_unit text,
  p_unit_value numeric,
  p_reason text,
  p_notes text default null
)
returns public.inventory_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.agricultural_products;
  v_delta numeric;
  v_movement public.inventory_movements;
begin
  if not app_private.is_active() then
    raise exception 'Cuenta bloqueada o inactiva.';
  end if;

  if not (app_private.can_manage_farm(p_farm_id) or app_private.is_farm_member(p_farm_id)) then
    raise exception 'No tienes permisos para registrar movimientos.';
  end if;

  if p_quantity <= 0 then
    raise exception 'La cantidad debe ser mayor a cero.';
  end if;

  select * into v_product
  from public.agricultural_products
  where id = p_product_id and farm_id = p_farm_id
  for update;

  if not found then
    raise exception 'Producto no encontrado.';
  end if;

  v_delta := case
    when p_movement_type in ('entry', 'adjustment_in') then p_quantity
    when p_movement_type in ('exit', 'loss', 'sale', 'adjustment_out') then -p_quantity
    else null
  end;

  if v_delta is null then
    raise exception 'Tipo de movimiento invalido.';
  end if;

  if v_product.current_stock + v_delta < 0 then
    raise exception 'La salida deja el inventario en cantidad invalida.';
  end if;

  update public.agricultural_products
  set current_stock = current_stock + v_delta
  where id = p_product_id;

  insert into public.inventory_movements (
    farm_id,
    entity_type,
    entity_id,
    movement_type,
    quantity,
    unit,
    unit_value,
    total_value,
    reason,
    notes,
    performed_by
  )
  values (
    p_farm_id,
    'product',
    p_product_id,
    p_movement_type,
    p_quantity,
    p_unit,
    p_unit_value,
    p_quantity * p_unit_value,
    p_reason,
    p_notes,
    (select auth.uid())
  )
  returning * into v_movement;

  return v_movement;
end;
$$;

create or replace function public.invite_farm_member(
  p_farm_id uuid,
  p_email text,
  p_role text,
  p_permissions jsonb default '{}'::jsonb
)
returns public.farm_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_member public.farm_members;
begin
  if not app_private.is_active() then
    raise exception 'Cuenta bloqueada o inactiva.';
  end if;

  if not (app_private.is_admin() or app_private.is_farm_owner(p_farm_id)) then
    raise exception 'Solo el propietario o administrador puede invitar trabajadores.';
  end if;

  select id into v_user_id from public.profiles where lower(email) = lower(p_email) limit 1;

  insert into public.farm_members (farm_id, user_id, invited_email, role, permissions, status)
  values (
    p_farm_id,
    v_user_id,
    case when v_user_id is null then lower(p_email) else null end,
    p_role,
    coalesce(p_permissions, '{}'::jsonb),
    case when v_user_id is null then 'pending' else 'active' end
  )
  on conflict do nothing;

  select * into v_member
  from public.farm_members
  where farm_id = p_farm_id
    and (user_id = v_user_id or lower(invited_email) = lower(p_email))
  limit 1;

  return v_member;
end;
$$;

alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.farm_members enable row level security;
alter table public.animals enable row level security;
alter table public.agricultural_products enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.tasks enable row level security;
alter table public.reminders enable row level security;
alter table public.financial_movements enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_announcements enable row level security;

create policy profiles_select on public.profiles for select to authenticated
using ((select auth.uid()) = id or app_private.is_support());
create policy profiles_insert_self on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);
create policy profiles_update_self_or_admin on public.profiles for update to authenticated
using ((select auth.uid()) = id or app_private.is_admin())
with check ((select auth.uid()) = id or app_private.is_admin());

create policy farms_select_members on public.farms for select to authenticated
using (app_private.is_admin() or app_private.is_farm_member(id) or app_private.is_support());
create policy farms_insert_owner on public.farms for insert to authenticated
with check (app_private.is_active() and owner_id = (select auth.uid()));
create policy farms_update_owner_admin on public.farms for update to authenticated
using (app_private.is_admin() or app_private.is_farm_owner(id))
with check (app_private.is_admin() or owner_id = (select auth.uid()));

create policy farm_members_select on public.farm_members for select to authenticated
using (app_private.is_admin() or app_private.is_farm_member(farm_id) or app_private.is_support());
create policy farm_members_insert_owner on public.farm_members for insert to authenticated
with check (app_private.is_admin() or app_private.is_farm_owner(farm_id));
create policy farm_members_update_owner on public.farm_members for update to authenticated
using (app_private.is_admin() or app_private.is_farm_owner(farm_id))
with check (app_private.is_admin() or app_private.is_farm_owner(farm_id));

create policy animals_select_members on public.animals for select to authenticated
using (app_private.is_admin() or app_private.is_farm_member(farm_id));
create policy animals_insert_manage on public.animals for insert to authenticated
with check (app_private.can_manage_farm(farm_id));
create policy animals_update_manage on public.animals for update to authenticated
using (app_private.can_manage_farm(farm_id))
with check (app_private.can_manage_farm(farm_id));

create policy products_select_members on public.agricultural_products for select to authenticated
using (app_private.is_admin() or app_private.is_farm_member(farm_id));
create policy products_insert_manage on public.agricultural_products for insert to authenticated
with check (app_private.can_manage_farm(farm_id));
create policy products_update_manage on public.agricultural_products for update to authenticated
using (app_private.can_manage_farm(farm_id))
with check (app_private.can_manage_farm(farm_id));

create policy inventory_select_members on public.inventory_movements for select to authenticated
using (app_private.is_admin() or app_private.is_farm_member(farm_id));
create policy inventory_insert_members on public.inventory_movements for insert to authenticated
with check (app_private.is_admin() or app_private.is_farm_member(farm_id));

create policy tasks_select_members on public.tasks for select to authenticated
using (app_private.is_admin() or app_private.is_farm_member(farm_id));
create policy tasks_insert_members on public.tasks for insert to authenticated
with check (app_private.is_admin() or app_private.is_farm_member(farm_id));
create policy tasks_update_assigned_or_manager on public.tasks for update to authenticated
using (app_private.can_manage_farm(farm_id) or assigned_to = (select auth.uid()) or created_by = (select auth.uid()))
with check (app_private.can_manage_farm(farm_id) or assigned_to = (select auth.uid()) or created_by = (select auth.uid()));

create policy reminders_select_members on public.reminders for select to authenticated
using (app_private.is_admin() or app_private.is_farm_member(farm_id));
create policy reminders_insert_members on public.reminders for insert to authenticated
with check (app_private.is_admin() or app_private.is_farm_member(farm_id));
create policy reminders_update_members on public.reminders for update to authenticated
using (app_private.can_manage_farm(farm_id) or created_by = (select auth.uid()))
with check (app_private.can_manage_farm(farm_id) or created_by = (select auth.uid()));

create policy finances_select_private on public.financial_movements for select to authenticated
using (app_private.is_admin() or app_private.is_farm_owner(farm_id));
create policy finances_insert_members on public.financial_movements for insert to authenticated
with check (app_private.is_admin() or app_private.is_farm_member(farm_id));
create policy finances_update_owner_admin on public.financial_movements for update to authenticated
using (app_private.is_admin() or app_private.is_farm_owner(farm_id))
with check (app_private.is_admin() or app_private.is_farm_owner(farm_id));

create policy tickets_select_allowed on public.support_tickets for select to authenticated
using (app_private.is_support() or user_id = (select auth.uid()) or (farm_id is not null and app_private.is_farm_member(farm_id)));
create policy tickets_insert_self on public.support_tickets for insert to authenticated
with check (app_private.is_active() and user_id = (select auth.uid()));
create policy tickets_update_allowed on public.support_tickets for update to authenticated
using (app_private.is_support() or user_id = (select auth.uid()))
with check (app_private.is_support() or user_id = (select auth.uid()));

create policy messages_select_allowed on public.support_messages for select to authenticated
using (app_private.can_access_ticket(ticket_id));
create policy messages_insert_allowed on public.support_messages for insert to authenticated
with check (app_private.can_access_ticket(ticket_id) and sender_id = (select auth.uid()));

create policy notifications_select_own on public.notifications for select to authenticated
using (user_id = (select auth.uid()) or app_private.is_admin());
create policy notifications_insert_admin on public.notifications for insert to authenticated
with check (app_private.is_admin());
create policy notifications_update_own on public.notifications for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy audit_select_admin on public.audit_logs for select to authenticated
using (app_private.is_admin());
create policy audit_insert_admin on public.audit_logs for insert to authenticated
with check (app_private.is_admin());

create policy announcements_select_targeted on public.system_announcements for select to authenticated
using (
  app_private.is_admin()
  or user_id = (select auth.uid())
  or target_role = 'all'
  or target_role = app_private.current_role()
  or (farm_id is not null and app_private.is_farm_member(farm_id))
);
create policy announcements_insert_admin on public.system_announcements for insert to authenticated
with check (app_private.is_admin());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on schema app_private to authenticated;
grant execute on function public.record_inventory_movement(uuid, uuid, text, numeric, text, numeric, text, text) to authenticated;
grant execute on function public.invite_farm_member(uuid, text, text, jsonb) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('agrosmart-avatars', 'agrosmart-avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('agrosmart-animals', 'agrosmart-animals', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('agrosmart-products', 'agrosmart-products', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('agrosmart-receipts', 'agrosmart-receipts', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('agrosmart-support', 'agrosmart-support', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy storage_read_authenticated_agrosmart on storage.objects for select to authenticated
using (bucket_id in ('agrosmart-avatars', 'agrosmart-animals', 'agrosmart-products', 'agrosmart-receipts', 'agrosmart-support') and app_private.is_active());
create policy storage_insert_authenticated_agrosmart on storage.objects for insert to authenticated
with check (bucket_id in ('agrosmart-avatars', 'agrosmart-animals', 'agrosmart-products', 'agrosmart-receipts', 'agrosmart-support') and app_private.is_active());
create policy storage_update_authenticated_agrosmart on storage.objects for update to authenticated
using (bucket_id in ('agrosmart-avatars', 'agrosmart-animals', 'agrosmart-products', 'agrosmart-receipts', 'agrosmart-support') and app_private.is_active())
with check (bucket_id in ('agrosmart-avatars', 'agrosmart-animals', 'agrosmart-products', 'agrosmart-receipts', 'agrosmart-support') and app_private.is_active());
