begin;

alter table public.businesses drop constraint businesses_status_check;
alter table public.businesses
  add constraint businesses_status_check
  check (status in ('onboarding', 'active', 'suspended', 'archived'));
alter table public.businesses alter column status set default 'onboarding';
alter table public.businesses add column currency_code text not null default 'AUD'
  check (currency_code = 'AUD');

alter table public.invitations alter column token_hash drop not null;
alter table public.invitations alter column expires_at drop not null;
alter table public.invitations add column invitation_status text not null default 'issued'
  check (invitation_status in ('draft', 'issued', 'used', 'revoked'));
alter table public.invitations drop constraint invitations_check;
alter table public.invitations add constraint invitations_lifecycle_check check (
  (invitation_status = 'draft' and token_hash is null and expires_at is null and revoked_at is null and used_at is null)
  or (invitation_status = 'issued' and token_hash is not null and expires_at is not null and expires_at > created_at and revoked_at is null and used_at is null)
  or (invitation_status = 'used' and token_hash is not null and expires_at is not null and used_at is not null and revoked_at is null)
  or (invitation_status = 'revoked' and revoked_at is not null and used_at is null)
);

create unique index invitations_one_open_role_per_business_idx
on public.invitations (business_id, invited_role)
where invitation_status in ('draft', 'issued');

create function public.list_platform_merchants()
returns table (
  id uuid, public_id text, name text, status text, timezone text,
  currency_code text, invitation_status text,
  created_at timestamptz, updated_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select b.id, b.public_id, b.name, b.status, b.timezone, b.currency_code,
    coalesce(i.invitation_status, 'draft'), b.created_at, b.updated_at
  from public.businesses b
  left join public.invitations i on i.business_id = b.id and i.invited_role = 'merchant_owner'
  where app_private.is_current_user_active_platform_owner()
  order by b.created_at desc;
$$;

create function public.create_platform_merchant(
  p_name text, p_owner_email text, p_timezone text, p_currency_code text
)
returns table (
  id uuid, public_id text, name text, status text, timezone text,
  currency_code text, invitation_status text,
  created_at timestamptz, updated_at timestamptz
)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  normalized_name text := btrim(p_name);
  normalized_email text := lower(btrim(p_owner_email));
  merchant_id uuid;
begin
  if current_user_id is null or not app_private.is_current_user_active_platform_owner() then
    return;
  end if;
  if char_length(normalized_name) not between 1 and 120
    or char_length(normalized_email) not between 3 and 254
    or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    or p_timezone <> 'Australia/Sydney'
    or p_currency_code <> 'AUD' then
    raise exception 'Invalid merchant metadata' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(normalized_name || chr(0) || normalized_email, 0));

  select b.id into merchant_id
  from public.businesses b
  join public.invitations i on i.business_id = b.id
  where lower(b.name) = lower(normalized_name)
    and i.email = normalized_email
    and i.invited_role = 'merchant_owner'
  limit 1;

  if merchant_id is null then
    insert into public.businesses (public_id, name, status, timezone, currency_code)
    values ('biz_' || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 16), normalized_name, 'onboarding', p_timezone, p_currency_code)
    returning businesses.id into merchant_id;

    insert into public.invitations (
      business_id, email, invited_role, token_hash, expires_at,
      created_by, invitation_status
    ) values (
      merchant_id, normalized_email, 'merchant_owner', null, null,
      current_user_id, 'draft'
    );

    insert into public.audit_events (
      actor_user_id, effective_business_id, event_type, target_type, target_id, safe_context
    ) values (
      current_user_id, merchant_id, 'merchant.created', 'business', merchant_id::text,
      jsonb_build_object('status', 'onboarding', 'invitation_status', 'draft')
    );
  end if;

  return query
  select b.id, b.public_id, b.name, b.status, b.timezone, b.currency_code,
    i.invitation_status, b.created_at, b.updated_at
  from public.businesses b
  join public.invitations i on i.business_id = b.id and i.invited_role = 'merchant_owner'
  where b.id = merchant_id;
end;
$$;

revoke all on function public.list_platform_merchants() from public, anon, authenticated;
revoke all on function public.create_platform_merchant(text, text, text, text) from public, anon, authenticated;
grant execute on function public.list_platform_merchants() to authenticated;
grant execute on function public.create_platform_merchant(text, text, text, text) to authenticated;

commit;
