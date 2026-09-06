begin;

create function public.resolve_merchant_magic_link_target(p_email text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.memberships m on m.user_id = u.id
    join public.businesses b on b.id = m.business_id
    where lower(u.email) = lower(trim(p_email))
      and m.role = 'merchant_owner'
      and m.status = 'active'
      and b.status in ('onboarding', 'active')
  );
$$;

create function public.start_current_merchant_session(p_session_token_hash text)
returns table (business_id uuid, membership_role text, absolute_expires_at timestamptz)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  eligible_business_ids uuid[];
  selected_business_id uuid;
  login_time timestamptz := statement_timestamp();
  created_session_id uuid;
begin
  if current_user_id is null or p_session_token_hash !~ '^[a-f0-9]{64}$' then return; end if;

  select array_agg(m.business_id order by m.created_at)
  into eligible_business_ids
  from public.memberships m
  join public.businesses b on b.id = m.business_id
  where m.user_id = current_user_id
    and m.role = 'merchant_owner'
    and m.status = 'active'
    and b.status in ('onboarding', 'active');

  if eligible_business_ids is null or array_length(eligible_business_ids, 1) <> 1 then return; end if;
  selected_business_id := eligible_business_ids[1];

  insert into public.merchant_application_sessions (
    user_id, business_id, token_hash, created_at, last_activity_at, absolute_expires_at
  ) values (
    current_user_id, selected_business_id, p_session_token_hash,
    login_time, login_time, login_time + interval '30 days'
  ) returning id into created_session_id;

  insert into public.audit_events (
    actor_user_id, effective_business_id, event_type, target_type, target_id, safe_context
  ) values (
    current_user_id, selected_business_id, 'auth.session.created',
    'merchant_application_session', created_session_id::text,
    jsonb_build_object('method', 'magic_link', 'result', 'authenticated')
  );

  return query select selected_business_id, 'merchant_owner'::text,
    login_time + interval '30 days';
end;
$$;

revoke all on function public.resolve_merchant_magic_link_target(text)
  from public, anon, authenticated, service_role;
grant execute on function public.resolve_merchant_magic_link_target(text)
  to service_role;

revoke all on function public.start_current_merchant_session(text)
  from public, anon, authenticated;
grant execute on function public.start_current_merchant_session(text)
  to authenticated;

commit;
