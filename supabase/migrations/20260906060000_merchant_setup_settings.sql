begin;

create table public.merchant_settings (
  business_id uuid primary key references public.businesses(id) on delete restrict,
  contact_email text null check (contact_email is null or (char_length(contact_email) between 3 and 254 and contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  contact_phone text null check (contact_phone is null or contact_phone ~ '^\+[1-9][0-9]{7,14}$'),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.merchant_settings (business_id)
select id from public.businesses
on conflict (business_id) do nothing;

alter table public.merchant_settings enable row level security;
revoke all on public.merchant_settings from public, anon, authenticated;

create function app_private.current_merchant_owner_business_id(p_session_token_hash text)
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
      and s.session_token_hash = p_session_token_hash
      and s.revoked_at is null
      and s.expires_at > now()
  )
  select case when count(*) = 1 then min(business_id::text)::uuid else null end
  into resolved_business_id from candidates;

  return resolved_business_id;
end;
$$;

revoke all on function app_private.current_merchant_owner_business_id(text) from public, anon, authenticated;
grant execute on function app_private.current_merchant_owner_business_id(text) to authenticated;

create function public.get_current_merchant_settings(p_session_token_hash text)
returns table (
  business_id uuid,
  business_name text,
  contact_email text,
  contact_phone text,
  currency_code text,
  timezone text,
  version integer,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.id, b.name, ms.contact_email, ms.contact_phone, b.currency_code, b.timezone,
    ms.version, greatest(b.updated_at, ms.updated_at)
  from public.businesses b
  join public.merchant_settings ms on ms.business_id = b.id
  where b.id = app_private.current_merchant_owner_business_id(p_session_token_hash);
$$;

create function public.update_current_merchant_settings(
  p_business_name text,
  p_contact_email text,
  p_contact_phone text,
  p_currency_code text,
  p_timezone text,
  p_expected_version integer,
  p_session_token_hash text
)
returns setof public.merchant_settings
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_business_id uuid := app_private.current_merchant_owner_business_id(p_session_token_hash);
  current_business public.businesses%rowtype;
  current_settings public.merchant_settings%rowtype;
  normalized_name text := btrim(p_business_name);
  normalized_email text := lower(btrim(p_contact_email));
  normalized_phone text := btrim(p_contact_phone);
  changed_fields text[] := array[]::text[];
begin
  if current_business_id is null then raise exception 'merchant_access_denied'; end if;
  if normalized_name = '' or char_length(normalized_name) > 120 or normalized_name ~ '[[:cntrl:]]' then raise exception 'settings_invalid'; end if;
  if p_currency_code <> 'AUD' or p_timezone <> 'Australia/Sydney' then raise exception 'settings_invalid'; end if;
  if char_length(normalized_email) not between 3 and 254 or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'settings_invalid'; end if;
  if normalized_phone !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'settings_invalid'; end if;
  if p_expected_version is null or p_expected_version < 1 then raise exception 'settings_invalid'; end if;

  select * into current_business from public.businesses where id = current_business_id for update;
  select * into current_settings from public.merchant_settings where business_id = current_business_id for update;

  if current_business.name = normalized_name and current_business.currency_code = p_currency_code
    and current_business.timezone = p_timezone and current_settings.contact_email = normalized_email
    and current_settings.contact_phone = normalized_phone then
    return next current_settings;
    return;
  end if;
  if current_settings.version <> p_expected_version then raise exception 'settings_conflict'; end if;

  if current_business.name is distinct from normalized_name then changed_fields := array_append(changed_fields, 'businessName'); end if;
  if current_settings.contact_email is distinct from normalized_email then changed_fields := array_append(changed_fields, 'contactEmail'); end if;
  if current_settings.contact_phone is distinct from normalized_phone then changed_fields := array_append(changed_fields, 'contactPhone'); end if;
  if current_business.currency_code is distinct from p_currency_code then changed_fields := array_append(changed_fields, 'currencyCode'); end if;
  if current_business.timezone is distinct from p_timezone then changed_fields := array_append(changed_fields, 'timezone'); end if;

  update public.businesses set name = normalized_name, currency_code = p_currency_code,
    timezone = p_timezone, updated_at = now() where id = current_business_id;
  update public.merchant_settings set contact_email = normalized_email, contact_phone = normalized_phone,
    version = version + 1, updated_at = now() where business_id = current_business_id
    returning * into current_settings;

  insert into public.audit_events (actor_user_id, effective_business_id, event_type, target_type, target_id, safe_context)
  values (current_user_id, current_business_id, 'merchant.settings_updated', 'merchant_settings', current_business_id::text,
    jsonb_build_object('changed_fields', changed_fields, 'version', current_settings.version));

  return next current_settings;
end;
$$;

revoke all on function public.get_current_merchant_settings(text) from public, anon, authenticated;
revoke all on function public.update_current_merchant_settings(text, text, text, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.get_current_merchant_settings(text) to authenticated;
grant execute on function public.update_current_merchant_settings(text, text, text, text, text, integer, text) to authenticated;

commit;
