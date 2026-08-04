create or replace function app_private.handle_new_user()
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
for each row execute function app_private.handle_new_user();

drop function if exists public.handle_new_user();

create or replace function app_private.record_inventory_movement(
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
language sql
security invoker
set search_path = public
as $$
  select *
  from app_private.record_inventory_movement(
    p_farm_id,
    p_product_id,
    p_movement_type,
    p_quantity,
    p_unit,
    p_unit_value,
    p_reason,
    p_notes
  );
$$;

create or replace function app_private.invite_farm_member(
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

create or replace function public.invite_farm_member(
  p_farm_id uuid,
  p_email text,
  p_role text,
  p_permissions jsonb default '{}'::jsonb
)
returns public.farm_members
language sql
security invoker
set search_path = public
as $$
  select *
  from app_private.invite_farm_member(
    p_farm_id,
    p_email,
    p_role,
    p_permissions
  );
$$;

revoke execute on function public.record_inventory_movement(uuid, uuid, text, numeric, text, numeric, text, text) from public;
revoke execute on function public.record_inventory_movement(uuid, uuid, text, numeric, text, numeric, text, text) from anon;
grant execute on function public.record_inventory_movement(uuid, uuid, text, numeric, text, numeric, text, text) to authenticated;

revoke execute on function public.invite_farm_member(uuid, text, text, jsonb) from public;
revoke execute on function public.invite_farm_member(uuid, text, text, jsonb) from anon;
grant execute on function public.invite_farm_member(uuid, text, text, jsonb) to authenticated;

revoke execute on function app_private.handle_new_user() from public;
revoke execute on function app_private.handle_new_user() from anon;
revoke execute on function app_private.handle_new_user() from authenticated;

revoke execute on function app_private.record_inventory_movement(uuid, uuid, text, numeric, text, numeric, text, text) from public;
revoke execute on function app_private.record_inventory_movement(uuid, uuid, text, numeric, text, numeric, text, text) from anon;
grant execute on function app_private.record_inventory_movement(uuid, uuid, text, numeric, text, numeric, text, text) to authenticated;

revoke execute on function app_private.invite_farm_member(uuid, text, text, jsonb) from public;
revoke execute on function app_private.invite_farm_member(uuid, text, text, jsonb) from anon;
grant execute on function app_private.invite_farm_member(uuid, text, text, jsonb) to authenticated;

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
