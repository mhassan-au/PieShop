begin;

alter table public.application_sessions
  add column provider_session_id uuid,
  add column authenticated_at timestamptz,
  add column authentication_method text;

alter table public.application_sessions
  add constraint application_sessions_provider_evidence_complete check (
    (provider_session_id is null and authenticated_at is null and authentication_method is null)
    or
    (provider_session_id is not null and authenticated_at is not null and authentication_method = 'password')
  );

create unique index application_sessions_provider_session_uidx
on public.application_sessions (provider_session_id)
where provider_session_id is not null;

alter table public.merchant_application_sessions
  add column provider_session_id uuid,
  add column authenticated_at timestamptz,
  add column authentication_method text;

alter table public.merchant_application_sessions
  add constraint merchant_sessions_provider_evidence_complete check (
    (provider_session_id is null and authenticated_at is null and authentication_method is null)
    or
    (provider_session_id is not null and authenticated_at is not null and authentication_method = 'magiclink')
  );

create unique index merchant_sessions_provider_business_uidx
on public.merchant_application_sessions (provider_session_id, business_id)
where provider_session_id is not null;

create function app_private.require_fresh_authentication(p_expected_method text)
returns table (
  provider_session_id uuid,
  authenticated_at timestamptz,
  authentication_method text,
  authentication_assurance text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  jwt_claims jsonb := auth.jwt();
  current_user_id uuid := auth.uid();
  provider_session_text text;
  matching_method_count integer;
  authentication_timestamp_text text;
begin
  if current_user_id is null
    or p_expected_method not in ('password', 'magiclink')
    or jsonb_typeof(jwt_claims -> 'amr') <> 'array'
  then
    return;
  end if;

  provider_session_text := jwt_claims ->> 'session_id';
  if provider_session_text is null
    or provider_session_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    return;
  end if;

  select count(*), min(method_entry ->> 'timestamp')
  into matching_method_count, authentication_timestamp_text
  from jsonb_array_elements(jwt_claims -> 'amr') as method_entry
  where method_entry ->> 'method' = p_expected_method
    and method_entry ->> 'timestamp' ~ '^[0-9]+(?:\.[0-9]+)?$';

  if matching_method_count <> 1 then
    return;
  end if;

  provider_session_id := provider_session_text::uuid;
  authenticated_at := to_timestamp(authentication_timestamp_text::double precision);
  authentication_method := p_expected_method;
  authentication_assurance := jwt_claims ->> 'aal';

  if authenticated_at > statement_timestamp()
    or statement_timestamp() >= authenticated_at + interval '5 minutes'
    or not exists (
      select 1
      from auth.sessions as provider_session
      where provider_session.id = provider_session_id
        and provider_session.user_id = current_user_id
    )
  then
    return;
  end if;

  return next;
end;
$$;

revoke all on function app_private.require_fresh_authentication(text)
  from public, anon, authenticated, service_role;

create function public.create_current_owner_session_from_password(
  p_token_hash text,
  p_device_label text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  authentication record;
  existing_session_id uuid;
  existing_token_hash text;
  created_session_id uuid;
  creation_time timestamptz := statement_timestamp();
begin
  if current_user_id is null
    or not app_private.is_current_user_active_platform_owner()
    or p_token_hash is null
    or p_token_hash !~ '^[a-f0-9]{64}$'
  then
    return null;
  end if;

  select * into authentication
  from app_private.require_fresh_authentication('password');
  if not found then
    return null;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(authentication.provider_session_id::text, 0)
  );

  select session.id, session.token_hash
  into existing_session_id, existing_token_hash
  from public.application_sessions as session
  where session.provider_session_id = authentication.provider_session_id;

  if existing_session_id is not null then
    if existing_token_hash = p_token_hash then
      return existing_session_id;
    end if;
    return null;
  end if;

  insert into public.application_sessions (
    user_id, token_hash, device_label, created_at, last_activity_at,
    absolute_expires_at, idle_expires_at, provider_session_id,
    authenticated_at, authentication_method
  ) values (
    current_user_id, p_token_hash, nullif(btrim(p_device_label), ''),
    authentication.authenticated_at, creation_time,
    authentication.authenticated_at + interval '12 hours',
    creation_time + interval '2 hours', authentication.provider_session_id,
    authentication.authenticated_at, authentication.authentication_method
  ) returning id into created_session_id;

  insert into public.audit_events (
    actor_user_id, event_type, target_type, target_id, safe_context
  ) values (
    current_user_id, 'auth.session.created', 'application_session',
    created_session_id::text,
    jsonb_build_object(
      'authentication_assurance', coalesce(authentication.authentication_assurance, 'unknown'),
      'authentication_method', authentication.authentication_method
    )
  );

  return created_session_id;
end;
$$;

create function public.start_current_merchant_session_from_magic_link(
  p_session_token_hash text
)
returns table (business_id uuid, membership_role text, absolute_expires_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  authentication record;
  eligible_business_ids uuid[];
  selected_business_id uuid;
  existing_session_id uuid;
  existing_token_hash text;
  existing_absolute_expires_at timestamptz;
  created_session_id uuid;
  creation_time timestamptz := statement_timestamp();
begin
  if current_user_id is null
    or p_session_token_hash !~ '^[a-f0-9]{64}$'
  then
    return;
  end if;

  select * into authentication
  from app_private.require_fresh_authentication('magiclink');
  if not found then return; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(authentication.provider_session_id::text, 0)
  );

  select array_agg(m.business_id order by m.created_at)
  into eligible_business_ids
  from public.memberships as m
  join public.businesses as b on b.id = m.business_id
  where m.user_id = current_user_id
    and m.role = 'merchant_owner'
    and m.status = 'active'
    and b.status in ('onboarding', 'active');

  if eligible_business_ids is null
    or array_length(eligible_business_ids, 1) <> 1
  then
    return;
  end if;
  selected_business_id := eligible_business_ids[1];

  select session.id, session.token_hash, session.absolute_expires_at
  into existing_session_id, existing_token_hash, existing_absolute_expires_at
  from public.merchant_application_sessions as session
  where session.provider_session_id = authentication.provider_session_id
    and session.business_id = selected_business_id;

  if existing_session_id is not null then
    if existing_token_hash = p_session_token_hash then
      return query select selected_business_id, 'merchant_owner'::text,
        existing_absolute_expires_at;
    end if;
    return;
  end if;

  insert into public.merchant_application_sessions (
    user_id, business_id, token_hash, created_at, last_activity_at,
    absolute_expires_at, provider_session_id, authenticated_at,
    authentication_method
  ) values (
    current_user_id, selected_business_id, p_session_token_hash,
    authentication.authenticated_at, creation_time,
    authentication.authenticated_at + interval '30 days',
    authentication.provider_session_id, authentication.authenticated_at,
    authentication.authentication_method
  ) returning id into created_session_id;

  insert into public.audit_events (
    actor_user_id, effective_business_id, event_type, target_type, target_id,
    safe_context
  ) values (
    current_user_id, selected_business_id, 'auth.session.created',
    'merchant_application_session', created_session_id::text,
    jsonb_build_object(
      'authentication_assurance', coalesce(authentication.authentication_assurance, 'unknown'),
      'authentication_method', authentication.authentication_method,
      'result', 'authenticated'
    )
  );

  return query select selected_business_id, 'merchant_owner'::text,
    authentication.authenticated_at + interval '30 days';
end;
$$;

create function public.redeem_merchant_invitation_from_magic_link(
  p_token_hash_hex text,
  p_session_token_hash text
)
returns table (business_id uuid, membership_role text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  authentication record;
  current_email text;
  invitation_row public.invitations%rowtype;
  existing_session_id uuid;
  existing_token_hash text;
  existing_business_id uuid;
  creation_time timestamptz := statement_timestamp();
begin
  if current_user_id is null
    or p_token_hash_hex !~ '^[0-9a-f]{64}$'
    or p_session_token_hash !~ '^[a-f0-9]{64}$'
  then
    return;
  end if;

  select * into authentication
  from app_private.require_fresh_authentication('magiclink');
  if not found then return; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(authentication.provider_session_id::text, 0)
  );

  select lower(user_row.email) into current_email
  from auth.users as user_row
  where user_row.id = current_user_id;
  if current_email is null then return; end if;

  select invitation.* into invitation_row
  from public.invitations as invitation
  join public.businesses as business on business.id = invitation.business_id
  where invitation.token_hash = decode(p_token_hash_hex, 'hex')
    and invitation.invitation_status in ('issued', 'used')
    and business.status in ('onboarding', 'active')
  for update of invitation;
  if not found or invitation_row.email <> current_email then return; end if;

  select session.id, session.token_hash, session.business_id
  into existing_session_id, existing_token_hash, existing_business_id
  from public.merchant_application_sessions as session
  where session.provider_session_id = authentication.provider_session_id
    and session.business_id = invitation_row.business_id;

  if existing_session_id is not null then
    if existing_token_hash = p_session_token_hash
      and invitation_row.invitation_status = 'used'
      and exists (
        select 1 from public.memberships as membership
        where membership.user_id = current_user_id
          and membership.business_id = existing_business_id
          and membership.role = 'merchant_owner'
          and membership.status = 'active'
      )
    then
      return query select existing_business_id, 'merchant_owner'::text;
    end if;
    return;
  end if;

  if invitation_row.invitation_status <> 'issued'
    or invitation_row.expires_at <= creation_time
  then
    return;
  end if;

  insert into public.memberships (business_id, user_id, role, status)
  values (invitation_row.business_id, current_user_id, 'merchant_owner', 'active')
  on conflict on constraint memberships_business_id_user_id_key
  do update set role = 'merchant_owner', status = 'active', updated_at = creation_time;

  insert into public.merchant_application_sessions (
    user_id, business_id, token_hash, created_at, last_activity_at,
    absolute_expires_at, provider_session_id, authenticated_at,
    authentication_method
  ) values (
    current_user_id, invitation_row.business_id, p_session_token_hash,
    authentication.authenticated_at, creation_time,
    authentication.authenticated_at + interval '30 days',
    authentication.provider_session_id, authentication.authenticated_at,
    authentication.authentication_method
  );

  update public.invitations
  set invitation_status = 'used', used_at = creation_time
  where id = invitation_row.id;

  insert into public.audit_events (
    actor_user_id, effective_business_id, event_type, target_type, target_id,
    safe_context
  ) values (
    current_user_id, invitation_row.business_id, 'invitation.redeemed',
    'invitation', invitation_row.id::text,
    jsonb_build_object(
      'authentication_method', authentication.authentication_method,
      'role', 'merchant_owner',
      'result', 'used'
    )
  );

  return query select invitation_row.business_id, 'merchant_owner'::text;
end;
$$;

revoke all on function public.create_current_owner_session(text, text)
  from public, anon, authenticated;
revoke all on function public.start_current_merchant_session(text)
  from public, anon, authenticated;
revoke all on function public.redeem_merchant_invitation(text, text)
  from public, anon, authenticated;

revoke all on function public.create_current_owner_session_from_password(text, text)
  from public, anon, authenticated;
revoke all on function public.start_current_merchant_session_from_magic_link(text)
  from public, anon, authenticated;
revoke all on function public.redeem_merchant_invitation_from_magic_link(text, text)
  from public, anon, authenticated;

grant execute on function public.create_current_owner_session_from_password(text, text)
  to authenticated;
grant execute on function public.start_current_merchant_session_from_magic_link(text)
  to authenticated;
grant execute on function public.redeem_merchant_invitation_from_magic_link(text, text)
  to authenticated;

revoke select, insert, update on public.catalogue_entries from authenticated;
revoke select, insert on public.transaction_records from authenticated;

drop policy catalogue_entries_select_member on public.catalogue_entries;
drop policy catalogue_entries_insert_member on public.catalogue_entries;
drop policy catalogue_entries_update_member on public.catalogue_entries;
drop policy transaction_records_select_member on public.transaction_records;
drop policy transaction_records_insert_member on public.transaction_records;

commit;
