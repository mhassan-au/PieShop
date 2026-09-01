create or replace function public.create_platform_merchant(
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
  if current_user_id is null or not app_private.is_current_user_active_platform_owner() then return; end if;
  if char_length(normalized_name) not between 1 and 120
    or char_length(normalized_email) not between 3 and 254
    or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    or p_timezone <> 'Australia/Sydney' or p_currency_code <> 'AUD' then
    raise exception 'Invalid merchant metadata' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(normalized_name || chr(31) || normalized_email, 0));
  select b.id into merchant_id from public.businesses b
  join public.invitations i on i.business_id = b.id
  where lower(b.name) = lower(normalized_name) and i.email = normalized_email
    and i.invited_role = 'merchant_owner' limit 1;

  if merchant_id is null then
    insert into public.businesses (public_id, name, status, timezone, currency_code)
    values ('biz_' || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 16), normalized_name, 'onboarding', p_timezone, p_currency_code)
    returning businesses.id into merchant_id;
    insert into public.invitations (business_id, email, invited_role, token_hash, expires_at, created_by, invitation_status)
    values (merchant_id, normalized_email, 'merchant_owner', null, null, current_user_id, 'draft');
    insert into public.audit_events (actor_user_id, effective_business_id, event_type, target_type, target_id, safe_context)
    values (current_user_id, merchant_id, 'merchant.created', 'business', merchant_id::text,
      jsonb_build_object('status', 'onboarding', 'invitation_status', 'draft'));
  end if;

  return query select b.id, b.public_id, b.name, b.status, b.timezone, b.currency_code,
    i.invitation_status, b.created_at, b.updated_at
  from public.businesses b join public.invitations i
    on i.business_id = b.id and i.invited_role = 'merchant_owner'
  where b.id = merchant_id;
end;
$$;
