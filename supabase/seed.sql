-- Datos demo ficticios de AgroSmart.
-- Antes de ejecutar:
-- 1. Crea estas cuentas desde Supabase Auth o desde la app:
--    productor.demo@agrosmart.local
--    trabajador1.demo@agrosmart.local
--    trabajador2.demo@agrosmart.local
--    soporte.demo@agrosmart.local
--    admin.demo@agrosmart.local
-- 2. Ejecuta este seed desde SQL Editor con privilegios de proyecto.

do $$
declare
  v_owner uuid;
  v_worker1 uuid;
  v_worker2 uuid;
  v_support uuid;
  v_admin uuid;
  v_farm uuid;
  v_product uuid;
  v_product2 uuid;
  v_ticket uuid;
begin
  select id into v_owner from public.profiles where email = 'productor.demo@agrosmart.local';
  select id into v_worker1 from public.profiles where email = 'trabajador1.demo@agrosmart.local';
  select id into v_worker2 from public.profiles where email = 'trabajador2.demo@agrosmart.local';
  select id into v_support from public.profiles where email = 'soporte.demo@agrosmart.local';
  select id into v_admin from public.profiles where email = 'admin.demo@agrosmart.local';

  if v_owner is null then
    raise exception 'Crea primero productor.demo@agrosmart.local en Supabase Auth.';
  end if;

  update public.profiles set full_name = 'Productor Demo AgroSmart', role = 'producer', status = 'active' where id = v_owner;
  update public.profiles set full_name = 'Trabajadora Demo Uno', role = 'worker', status = 'active' where id = v_worker1;
  update public.profiles set full_name = 'Trabajador Demo Dos', role = 'worker', status = 'active' where id = v_worker2;
  update public.profiles set full_name = 'Soporte Demo AgroSmart', role = 'support', status = 'active' where id = v_support;
  update public.profiles set full_name = 'Admin Demo AgroSmart', role = 'admin', status = 'active' where id = v_admin;

  insert into public.farms (
    owner_id, name, description, production_type, department, municipality, address_description, area, area_unit
  )
  values (
    v_owner,
    'Finca Mixta La Esperanza Demo',
    'Finca ficticia con ganado bovino, maiz y platano para demostracion.',
    'mixed',
    'Meta',
    'Granada',
    'Vereda demo, via principal rural',
    24.5,
    'hectares'
  )
  returning id into v_farm;

  insert into public.farm_members (farm_id, user_id, role, permissions, status)
  values
    (v_farm, v_owner, 'owner', '{"tasks.manage":true,"inventory.manage":true,"finances.report_expense":true}'::jsonb, 'active'),
    (v_farm, v_worker1, 'worker', '{"tasks.manage":true,"inventory.movements":true,"finances.report_expense":true}'::jsonb, 'active'),
    (v_farm, v_worker2, 'worker', '{"tasks.manage":true,"inventory.movements":false,"finances.report_expense":true}'::jsonb, 'active')
  on conflict do nothing;

  insert into public.animals (farm_id, identification_code, name, species, breed, sex, birth_date, acquisition_date, weight, status, notes)
  values
    (v_farm, 'BOV-001', 'Lucera', 'Bovino', 'Brahman', 'female', '2022-04-14', '2023-01-10', 430, 'active', 'Animal demo sano.'),
    (v_farm, 'BOV-002', 'Canela', 'Bovino', 'Gyr', 'female', '2021-09-20', '2022-12-01', 460, 'active', 'Lista para revision reproductiva.'),
    (v_farm, 'BOV-003', 'Rayo', 'Bovino', 'Cebu', 'male', '2020-03-03', '2022-02-12', 620, 'active', 'Reproductor demo.'),
    (v_farm, 'BOV-004', 'Estrella', 'Bovino', 'Normando', 'female', '2023-05-19', '2023-07-02', 310, 'active', null),
    (v_farm, 'BOV-005', 'Mora', 'Bovino', 'Brahman', 'female', '2022-11-11', '2023-02-22', 395, 'active', null),
    (v_farm, 'BOV-006', 'Toro Demo', 'Bovino', 'Cebu', 'male', '2021-08-08', '2023-03-18', 590, 'active', null),
    (v_farm, 'BOV-007', 'Nube', 'Bovino', 'Gyr', 'female', '2024-01-15', '2024-03-01', 210, 'active', null),
    (v_farm, 'BOV-008', 'Sol', 'Bovino', 'Brahman', 'female', '2020-10-10', '2021-01-30', 480, 'sold', 'Vendida en demo.'),
    (v_farm, 'BOV-009', 'Luna', 'Bovino', 'Normando', 'female', '2023-06-26', '2023-09-04', 290, 'active', null),
    (v_farm, 'BOV-010', 'Brisa', 'Bovino', 'Gyr', 'female', '2022-02-14', '2022-05-09', 420, 'active', null);

  insert into public.agricultural_products (farm_id, name, category, crop_type, unit, current_stock, minimum_stock, unit_cost, sale_price, status, notes)
  values
    (v_farm, 'Maiz amarillo demo', 'cereal', 'semestral', 'kg', 850, 200, 1200, 1800, 'active', 'Producto ficticio.'),
    (v_farm, 'Platano harton demo', 'fruta', 'permanente', 'racimo', 120, 30, 8000, 13000, 'active', 'Producto ficticio.'),
    (v_farm, 'Yuca demo', 'tuberculo', 'semestral', 'kg', 300, 80, 900, 1400, 'active', null),
    (v_farm, 'Concentrado demo', 'insumo', null, 'bulto', 18, 10, 78000, 0, 'active', 'Insumo para ganado.'),
    (v_farm, 'Fertilizante demo', 'insumo', null, 'bulto', 7, 8, 95000, 0, 'active', 'Bajo inventario demo.')
  returning id into v_product;

  select id into v_product from public.agricultural_products where farm_id = v_farm and name = 'Maiz amarillo demo';
  select id into v_product2 from public.agricultural_products where farm_id = v_farm and name = 'Fertilizante demo';

  insert into public.inventory_movements (farm_id, entity_type, entity_id, movement_type, quantity, unit, unit_value, total_value, reason, notes, performed_by)
  values
    (v_farm, 'product', v_product, 'entry', 1000, 'kg', 1200, 1200000, 'Cosecha inicial demo', null, v_owner),
    (v_farm, 'product', v_product, 'sale', 150, 'kg', 1800, 270000, 'Venta local demo', null, v_owner),
    (v_farm, 'product', v_product2, 'exit', 3, 'bulto', 95000, 285000, 'Aplicacion en lote demo', null, v_worker1);

  insert into public.tasks (farm_id, title, description, category, assigned_to, created_by, priority, status, due_date, notes)
  values
    (v_farm, 'Revisar bebederos', 'Verificar agua limpia en potreros.', 'ganado', v_worker1, v_owner, 'high', 'pending', current_date + 1, null),
    (v_farm, 'Aplicar fertilizante', 'Lote de maiz demo.', 'cultivo', v_worker2, v_owner, 'medium', 'in_progress', current_date + 3, 'Usar proteccion.'),
    (v_farm, 'Actualizar inventario', 'Contar bultos de concentrado.', 'inventario', v_worker1, v_owner, 'medium', 'pending', current_date + 2, null);

  insert into public.reminders (farm_id, title, description, category, related_entity_type, reminder_date, recurrence, status, created_by)
  values
    (v_farm, 'Vacunacion lote joven', 'Recordatorio demo de vacunacion.', 'vacunacion', 'farm', now() + interval '4 days', 'none', 'pending', v_owner),
    (v_farm, 'Cosecha de maiz', 'Revisar humedad antes de cosecha.', 'cosecha', 'farm', now() + interval '10 days', 'none', 'pending', v_owner),
    (v_farm, 'Mantenimiento de cerca', 'Potrero norte.', 'mantenimiento', 'farm', now() + interval '7 days', 'monthly', 'pending', v_owner);

  insert into public.financial_movements (farm_id, type, category, description, amount, transaction_date, related_entity_type, created_by)
  values
    (v_farm, 'expense', 'insumos', 'Compra de sal mineral demo', 240000, current_date - 6, 'none', v_owner),
    (v_farm, 'expense', 'mano de obra', 'Jornal de cosecha demo', 180000, current_date - 3, 'none', v_owner),
    (v_farm, 'income', 'venta', 'Venta de maiz demo', 270000, current_date - 2, 'product', v_owner),
    (v_farm, 'income', 'venta', 'Venta de platano demo', 390000, current_date - 1, 'product', v_owner);

  insert into public.support_tickets (user_id, farm_id, subject, description, category, priority, status, assigned_to)
  values (v_owner, v_farm, 'Consulta demo sobre inventario', 'Necesito ayuda para registrar una salida.', 'inventario', 'medium', 'open', v_support)
  returning id into v_ticket;

  insert into public.support_messages (ticket_id, sender_id, message)
  values
    (v_ticket, v_owner, 'Hola, este es un ticket de demostracion.'),
    (v_ticket, v_support, 'Gracias por escribir. Puedes usar Nuevo movimiento y elegir salida.');

  insert into public.notifications (user_id, title, body, type, related_entity_type, related_entity_id)
  values
    (v_owner, 'Demo lista', 'La finca demo ya tiene datos para explorar AgroSmart.', 'system', 'farm', v_farm),
    (v_worker1, 'Nueva tarea asignada', 'Revisar bebederos.', 'task', 'task', null);

  insert into public.system_announcements (title, body, target_role, created_by)
  values ('Bienvenido a AgroSmart Demo', 'Estos datos son ficticios y sirven para probar el MVP.', 'all', coalesce(v_admin, v_owner));
end $$;
