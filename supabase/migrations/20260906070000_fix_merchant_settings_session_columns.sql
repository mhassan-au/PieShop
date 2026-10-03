begin;

create or replace function app_private.current_merchant_owner_business_id(p_session_token_hash text)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  resolved_business_id uuid;
begin
  if (select auth.uid()) is null or p_session_token_hash is null or char_length(p_session_token_hash) <> 64 then
    return null;
  end if;

  with candidates as (
    select distinct m.business_id
    from public.memberships m
    join public.businesses b on b.id = m.business_id
    join public.merchant_application_sessions s
      on s.user_id = m.user_id and s.business_id = m.business_id
    where m.user_id = (select auth.uid())
      and m.role = 'merchant_owner'
      and m.status = 'active'
      and b.status in ('onboarding', 'active')
      and s.token_hash = p_session_token_hash
      and s.revoked_at is null
      and s.absolute_expires_at > now()
  )
  select case when count(*) = 1 then min(business_id::text)::uuid else null end
  into resolved_business_id from candidates;

  return resolved_business_id;
end;
$$;

revoke all on function app_private.current_merchant_owner_business_id(text) from public, anon, authenticated;
grant execute on function app_private.current_merchant_owner_business_id(text) to authenticated;

commit;
