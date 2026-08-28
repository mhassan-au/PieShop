begin;

create function app_private.is_current_user_active_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_roles pr
    where pr.user_id = (select auth.uid())
      and pr.role = 'platform_owner'
      and pr.is_active
  );
$$;

create function app_private.current_user_has_active_membership(check_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.user_id = (select auth.uid())
      and m.business_id = check_business_id
      and m.status = 'active'
  );
$$;

revoke all on function app_private.is_current_user_active_platform_owner() from public;
revoke all on function app_private.current_user_has_active_membership(uuid) from public;
grant execute on function app_private.is_current_user_active_platform_owner() to authenticated;
grant execute on function app_private.current_user_has_active_membership(uuid) to authenticated;

drop policy businesses_select_authorised on public.businesses;
create policy businesses_select_authorised on public.businesses
for select to authenticated
using (
  app_private.is_current_user_active_platform_owner()
  or app_private.current_user_has_active_membership(id)
);

drop policy catalogue_entries_select_member on public.catalogue_entries;
create policy catalogue_entries_select_member on public.catalogue_entries
for select to authenticated
using (app_private.current_user_has_active_membership(business_id));

drop policy catalogue_entries_insert_member on public.catalogue_entries;
create policy catalogue_entries_insert_member on public.catalogue_entries
for insert to authenticated
with check (app_private.current_user_has_active_membership(business_id));

drop policy catalogue_entries_update_member on public.catalogue_entries;
create policy catalogue_entries_update_member on public.catalogue_entries
for update to authenticated
using (app_private.current_user_has_active_membership(business_id))
with check (app_private.current_user_has_active_membership(business_id));

drop policy transaction_records_select_member on public.transaction_records;
create policy transaction_records_select_member on public.transaction_records
for select to authenticated
using (app_private.current_user_has_active_membership(business_id));

drop policy transaction_records_insert_member on public.transaction_records;
create policy transaction_records_insert_member on public.transaction_records
for insert to authenticated
with check (app_private.current_user_has_active_membership(business_id));

revoke all on function app_private.is_active_platform_owner(uuid) from public, anon, authenticated;
revoke all on function app_private.has_active_membership(uuid, uuid) from public, anon, authenticated;
drop function app_private.is_active_platform_owner(uuid);
drop function app_private.has_active_membership(uuid, uuid);

commit;
