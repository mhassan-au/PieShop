begin;

create function public.change_platform_merchant_status(
  p_business_id uuid,
  p_target_status text
)
returns boolean
language plpgsql volatile security definer set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_status text;
  transition_key text;
  eligible_owner_count integer;
  transition_time timestamptz := statement_timestamp();
begin
  if current_user_id is null
    or not app_private.is_current_user_active_platform_owner() then
    return false;
  end if;
  if p_target_status not in ('active', 'suspended', 'archived') then
    raise exception 'Invalid merchant target status' using errcode = '22023';
  end if;

  select b.status into current_status
  from public.businesses b
  where b.id = p_business_id
  for update;
  if current_status is null then return false; end if;
  if current_status = p_target_status then return true; end if;

  transition_key := current_status || ':' || p_target_status;
  if transition_key not in (
    'onboarding:active',
    'onboarding:suspended',
    'active:suspended',
    'suspended:active',
    'suspended:archived'
  ) then
    raise exception 'Merchant status transition is not allowed' using errcode = '22023';
  end if;

  if p_target_status = 'active' then
    select count(*) into eligible_owner_count
    from public.memberships m
    join public.invitations i
      on i.business_id = m.business_id and i.invited_role = 'merchant_owner'
    where m.business_id = p_business_id
      and m.role = 'merchant_owner'
      and m.status = 'active'
      and i.invitation_status = 'used';
    if eligible_owner_count <> 1 then
      raise exception 'Merchant activation prerequisites are incomplete' using errcode = '22023';
    end if;
  end if;

  if p_target_status in ('suspended', 'archived') then
    update public.merchant_application_sessions s
    set revoked_at = transition_time,
      revoked_reason = 'suspension'
    where s.business_id = p_business_id and s.revoked_at is null;
  end if;

  update public.businesses b
  set status = p_target_status, updated_at = transition_time
  where b.id = p_business_id;

  insert into public.audit_events (
    actor_user_id, effective_business_id, event_type, target_type, target_id, safe_context
  ) values (
    current_user_id, p_business_id, 'merchant.status_changed', 'business', p_business_id::text,
    jsonb_build_object('previous_status', current_status, 'next_status', p_target_status)
  );
  return true;
end;
$$;

revoke all on function public.change_platform_merchant_status(uuid, text)
  from public, anon, authenticated;
grant execute on function public.change_platform_merchant_status(uuid, text)
  to authenticated;

commit;
