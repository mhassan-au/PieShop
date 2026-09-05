begin;

create table public.merchant_application_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default statement_timestamp(),
  last_activity_at timestamptz not null default statement_timestamp(),
  absolute_expires_at timestamptz not null default (statement_timestamp() + interval '30 days'),
  revoked_at timestamptz,
  revoked_reason text check (revoked_reason is null or revoked_reason in ('logout', 'merchant_action', 'membership_change', 'suspension', 'recovery', 'security_event')),
  check (absolute_expires_at = created_at + interval '30 days'),
  check (last_activity_at >= created_at),
  check (revoked_at is null or revoked_at >= created_at)
);

create index merchant_application_sessions_user_business_idx
on public.merchant_application_sessions (user_id, business_id, absolute_expires_at desc);

alter table public.merchant_application_sessions enable row level security;
revoke all on public.merchant_application_sessions from public, anon, authenticated;

drop function public.redeem_merchant_invitation(text);
create function public.redeem_merchant_invitation(p_token_hash_hex text, p_session_token_hash text)
returns table (business_id uuid, membership_role text)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_email text;
  invitation_row public.invitations%rowtype;
  redemption_time timestamptz := statement_timestamp();
begin
  if current_user_id is null or p_token_hash_hex !~ '^[0-9a-f]{64}$'
    or p_session_token_hash !~ '^[a-f0-9]{64}$' then return; end if;
  select lower(u.email) into current_email from auth.users u where u.id = current_user_id;
  if current_email is null then return; end if;

  select i.* into invitation_row from public.invitations i
  join public.businesses b on b.id = i.business_id
  where i.token_hash = decode(p_token_hash_hex, 'hex')
    and i.invitation_status = 'issued' and i.expires_at > redemption_time
    and b.status = 'onboarding'
  for update of i;
  if not found or invitation_row.email <> current_email then return; end if;

  insert into public.memberships (business_id, user_id, role, status)
  values (invitation_row.business_id, current_user_id, 'merchant_owner', 'active')
  on conflict (business_id, user_id) do update set role = 'merchant_owner', status = 'active', updated_at = redemption_time;

  insert into public.merchant_application_sessions (
    user_id, business_id, token_hash, created_at, last_activity_at, absolute_expires_at
  ) values (
    current_user_id, invitation_row.business_id, p_session_token_hash,
    redemption_time, redemption_time, redemption_time + interval '30 days'
  );

  update public.invitations set invitation_status = 'used', used_at = redemption_time where id = invitation_row.id;
  insert into public.audit_events (actor_user_id, effective_business_id, event_type, target_type, target_id, safe_context)
  values (current_user_id, invitation_row.business_id, 'invitation.redeemed', 'invitation', invitation_row.id::text,
    jsonb_build_object('role', 'merchant_owner', 'result', 'used'));
  return query select invitation_row.business_id, 'merchant_owner'::text;
end;
$$;

create function public.verify_current_merchant_session(p_session_token_hash text)
returns table (business_id uuid, membership_role text, absolute_expires_at timestamptz)
language plpgsql volatile security definer set search_path = ''
as $$
declare current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null or p_session_token_hash !~ '^[a-f0-9]{64}$' then return; end if;
  return query
  update public.merchant_application_sessions s set last_activity_at = statement_timestamp()
  from public.memberships m, public.businesses b
  where s.token_hash = p_session_token_hash and s.user_id = current_user_id
    and s.revoked_at is null and s.absolute_expires_at > statement_timestamp()
    and m.user_id = current_user_id and m.business_id = s.business_id and m.status = 'active'
    and b.id = s.business_id and b.status in ('onboarding', 'active')
  returning s.business_id, m.role, s.absolute_expires_at;
end;
$$;

revoke all on function public.redeem_merchant_invitation(text, text) from public, anon, authenticated;
revoke all on function public.verify_current_merchant_session(text) from public, anon, authenticated;
grant execute on function public.redeem_merchant_invitation(text, text) to authenticated;
grant execute on function public.verify_current_merchant_session(text) to authenticated;

commit;
