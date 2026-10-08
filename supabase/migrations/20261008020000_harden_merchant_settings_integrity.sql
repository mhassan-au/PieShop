begin;

create or replace function app_private.current_merchant_owner_business_id(
  p_session_token_hash text
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  eligible_owner_count integer;
  eligible_business_id uuid;
begin
  if current_user_id is null
    or p_session_token_hash is null
    or p_session_token_hash !~ '^[a-f0-9]{64}$' then
    return null;
  end if;

  select count(distinct m.business_id), min(m.business_id::text)::uuid
  into eligible_owner_count, eligible_business_id
  from public.memberships m
  join public.businesses b on b.id = m.business_id
  where m.user_id = current_user_id
    and m.role = 'merchant_owner'
    and m.status = 'active'
    and b.status in ('onboarding', 'active');

  if eligible_owner_count <> 1 then return null; end if;

  if not exists (
    select 1
    from public.merchant_application_sessions s
    where s.user_id = current_user_id
      and s.business_id = eligible_business_id
      and s.token_hash = p_session_token_hash
      and s.revoked_at is null
      and s.absolute_expires_at > statement_timestamp()
  ) then
    return null;
  end if;

  return eligible_business_id;
end;
$$;

revoke all on function app_private.current_merchant_owner_business_id(text)
from public, anon, authenticated;
grant execute on function app_private.current_merchant_owner_business_id(text)
to authenticated;

drop function public.update_current_merchant_settings(
  text, text, text, text, text, integer, text
);

create function public.update_current_merchant_settings(
  p_business_name text,
  p_contact_email text,
  p_contact_phone text,
  p_currency_code text,
  p_timezone text,
  p_expected_version integer,
  p_session_token_hash text
)
returns table (business_id uuid, version integer, updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  candidate_business_id uuid;
  eligible_business_id uuid;
  eligible_owner_count integer;
  normalized_name text;
  normalized_email text;
  normalized_phone text;
  locked_business public.businesses%rowtype;
  locked_settings public.merchant_settings%rowtype;
  session_is_live boolean := false;
  changed_fields text[] := array[]::text[];
  mutation_time timestamptz := statement_timestamp();
begin
  if current_user_id is null
    or p_business_name is null
    or p_contact_email is null
    or p_contact_phone is null
    or p_currency_code is null
    or p_timezone is null
    or p_expected_version is null
    or p_session_token_hash is null then
    raise exception 'settings_invalid' using errcode = '22023';
  end if;

  normalized_name := btrim(p_business_name);
  normalized_email := lower(btrim(p_contact_email));
  normalized_phone := btrim(p_contact_phone);

  if normalized_name = ''
    or char_length(normalized_name) > 120
    or normalized_name ~ '[[:cntrl:]]'
    or char_length(normalized_email) not between 3 and 254
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or normalized_phone !~ '^\+[1-9][0-9]{7,14}$'
    or p_currency_code <> 'AUD'
    or p_timezone <> 'Australia/Sydney'
    or p_expected_version < 1
    or p_session_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'settings_invalid' using errcode = '22023';
  end if;

  select s.business_id into candidate_business_id
  from public.merchant_application_sessions s
  where s.user_id = current_user_id
    and s.token_hash = p_session_token_hash;
  if candidate_business_id is null then
    raise exception 'merchant_access_denied' using errcode = '42501';
  end if;

  -- stage: lock business
  select * into locked_business
  from public.businesses b
  where b.id = candidate_business_id
  for update;
  if locked_business.id is null then
    raise exception 'merchant_access_denied' using errcode = '42501';
  end if;

  -- stage: recheck authority
  select count(distinct m.business_id), min(m.business_id::text)::uuid
  into eligible_owner_count, eligible_business_id
  from public.memberships m
  join public.businesses b on b.id = m.business_id
  where m.user_id = current_user_id
    and m.role = 'merchant_owner'
    and m.status = 'active'
    and b.status in ('onboarding', 'active');
  if eligible_owner_count <> 1
    or eligible_business_id <> candidate_business_id
    or locked_business.status not in ('onboarding', 'active') then
    raise exception 'merchant_access_denied' using errcode = '42501';
  end if;

  -- stage: lock exact session
  select true into session_is_live
  from public.merchant_application_sessions s
  where s.user_id = current_user_id
    and s.business_id = candidate_business_id
    and s.token_hash = p_session_token_hash
    and s.revoked_at is null
    and s.absolute_expires_at > mutation_time
  for update;
  if not coalesce(session_is_live, false) then
    raise exception 'merchant_access_denied' using errcode = '42501';
  end if;

  -- stage: lock settings
  select * into locked_settings
  from public.merchant_settings ms
  where ms.business_id = candidate_business_id
  for update;
  if locked_settings.business_id is null then
    raise exception 'settings_unavailable' using errcode = '55000';
  end if;

  if locked_business.name = normalized_name
    and locked_business.currency_code = p_currency_code
    and locked_business.timezone = p_timezone
    and locked_settings.contact_email = normalized_email
    and locked_settings.contact_phone = normalized_phone then
    return query select candidate_business_id, locked_settings.version, locked_settings.updated_at;
    return;
  end if;

  if locked_settings.version <> p_expected_version then
    raise exception 'settings_conflict' using errcode = '40001';
  end if;

  if locked_business.name is distinct from normalized_name then
    changed_fields := array_append(changed_fields, 'businessName');
  end if;
  if locked_settings.contact_email is distinct from normalized_email then
    changed_fields := array_append(changed_fields, 'contactEmail');
  end if;
  if locked_settings.contact_phone is distinct from normalized_phone then
    changed_fields := array_append(changed_fields, 'contactPhone');
  end if;
  if locked_business.currency_code is distinct from p_currency_code then
    changed_fields := array_append(changed_fields, 'currencyCode');
  end if;
  if locked_business.timezone is distinct from p_timezone then
    changed_fields := array_append(changed_fields, 'timezone');
  end if;

  update public.businesses b
  set name = normalized_name,
      currency_code = p_currency_code,
      timezone = p_timezone,
      updated_at = mutation_time
  where b.id = candidate_business_id;

  update public.merchant_settings ms
  set contact_email = normalized_email,
      contact_phone = normalized_phone,
      version = ms.version + 1,
      updated_at = mutation_time
  where ms.business_id = candidate_business_id
  returning ms.* into locked_settings;

  insert into public.audit_events (
    actor_user_id, effective_business_id, event_type,
    target_type, target_id, safe_context
  ) values (
    current_user_id, candidate_business_id, 'merchant.settings_updated',
    'merchant_settings', candidate_business_id::text,
    jsonb_build_object(
      'changed_fields', changed_fields,
      'version', locked_settings.version
    )
  );

  return query select candidate_business_id, locked_settings.version, locked_settings.updated_at;
end;
$$;

revoke all on function public.update_current_merchant_settings(
  text, text, text, text, text, integer, text
) from public, anon, authenticated;
grant execute on function public.update_current_merchant_settings(
  text, text, text, text, text, integer, text
) to authenticated;

commit;
