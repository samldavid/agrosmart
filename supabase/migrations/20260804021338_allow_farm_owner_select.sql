drop policy if exists farms_select_members on public.farms;

create policy farms_select_members on public.farms for select to authenticated
using (
  app_private.is_admin()
  or owner_id = (select auth.uid())
  or app_private.is_farm_member(id)
  or app_private.is_support()
);
