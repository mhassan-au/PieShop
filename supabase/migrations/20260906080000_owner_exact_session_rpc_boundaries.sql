begin;

create function app_private.is_current_owner_session(p_owner_session_token_hash text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  session_is_live boolean := false;
begin
  if (select auth.uid()) is null
    or p_owner_session_token_hash is null
    or p_owner_session_token_hash !~ '^[a-f0-9]{64}$' then
    return false;
  end if;

  select true into session_is_live
  from public.application_sessions s
  join public.platform_roles pr
    on pr.user_id = s.user_id
    and pr.role = 'platform_owner'
    and pr.is_active
  where s.user_id = (select auth.uid())
    and s.token_hash = p_owner_session_token_hash
    and s.revoked_at is null
    and s.absolute_expires_at > statement_timestamp()
    and s.idle_expires_at > statement_timestamp()
  for share of s, pr;

  return coalesce(session_is_live, false);
end;
$$;

revoke all on function app_private.is_current_owner_session(text)
  from public, anon, authenticated;

alter function public.list_platform_merchants() set schema app_private;
alter function public.create_platform_merchant(text, text, text, text) set schema app_private;
alter function public.issue_platform_merchant_invitation(uuid, text, timestamptz) set schema app_private;
alter function public.revoke_platform_merchant_invitation(uuid) set schema app_private;
alter function public.change_platform_merchant_status(uuid, text) set schema app_private;
alter function public.list_current_user_application_sessions(text) set schema app_private;
alter function public.revoke_current_owner_session(uuid, text) set schema app_private;
alter function public.revoke_all_current_user_sessions(text) set schema app_private;
drop function public.list_current_user_application_sessions();

revoke all on function app_private.list_platform_merchants()
  from public, anon, authenticated;
revoke all on function app_private.create_platform_merchant(text, text, text, text)
  from public, anon, authenticated;
revoke all on function app_private.issue_platform_merchant_invitation(uuid, text, timestamptz)
  from public, anon, authenticated;
revoke all on function app_private.revoke_platform_merchant_invitation(uuid)
  from public, anon, authenticated;
revoke all on function app_private.change_platform_merchant_status(uuid, text)
  from public, anon, authenticated;
revoke all on function app_private.list_current_user_application_sessions(text)
  from public, anon, authenticated;
revoke all on function app_private.revoke_current_owner_session(uuid, text)
  from public, anon, authenticated;
revoke all on function app_private.revoke_all_current_user_sessions(text)
  from public, anon, authenticated;

create function public.list_platform_merchants(p_owner_session_token_hash text)
returns table (
  id uuid, public_id text, name text, status text, timezone text,
  currency_code text, invitation_status text,
  created_at timestamptz, updated_at timestamptz
)
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not app_private.is_current_owner_session(p_owner_session_token_hash) then return; end if;
  return query select * from app_private.list_platform_merchants();
end;
$$;

create function public.create_platform_merchant(
  p_name text, p_owner_email text, p_timezone text, p_currency_code text,
  p_owner_session_token_hash text
)
returns table (
  id uuid, public_id text, name text, status text, timezone text,
  currency_code text, invitation_status text,
  created_at timestamptz, updated_at timestamptz
)
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not app_private.is_current_owner_session(p_owner_session_token_hash) then return; end if;
  return query select * from app_private.create_platform_merchant(
    p_name, p_owner_email, p_timezone, p_currency_code
  );
end;
$$;

create function public.issue_platform_merchant_invitation(
  p_business_id uuid, p_token_hash_hex text, p_expires_at timestamptz,
  p_owner_session_token_hash text
)
returns table (business_id uuid, invitation_status text, issued_at timestamptz, expires_at timestamptz)
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not app_private.is_current_owner_session(p_owner_session_token_hash) then return; end if;
  return query select * from app_private.issue_platform_merchant_invitation(
    p_business_id, p_token_hash_hex, p_expires_at
  );
end;
$$;

create function public.revoke_platform_merchant_invitation(
  p_business_id uuid, p_owner_session_token_hash text
)
returns table (business_id uuid, invitation_status text, revoked_at timestamptz)
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not app_private.is_current_owner_session(p_owner_session_token_hash) then return; end if;
  return query select * from app_private.revoke_platform_merchant_invitation(p_business_id);
end;
$$;

create function public.change_platform_merchant_status(
  p_business_id uuid, p_target_status text, p_owner_session_token_hash text
)
returns boolean
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not app_private.is_current_owner_session(p_owner_session_token_hash) then return false; end if;
  return app_private.change_platform_merchant_status(p_business_id, p_target_status);
end;
$$;

create function public.list_current_user_application_sessions(
  p_owner_session_token_hash text
)
returns table (
  id uuid, device_label text, created_at timestamptz,
  last_activity_at timestamptz, absolute_expires_at timestamptz,
  idle_expires_at timestamptz, revoked_at timestamptz,
  revoked_reason text, is_current boolean
)
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not app_private.is_current_owner_session(p_owner_session_token_hash) then return; end if;
  return query select * from app_private.list_current_user_application_sessions(
    p_owner_session_token_hash
  );
end;
$$;

create function public.revoke_current_owner_session(
  p_session_id uuid, p_reason text, p_owner_session_token_hash text
)
returns boolean
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not app_private.is_current_owner_session(p_owner_session_token_hash) then return false; end if;
  return app_private.revoke_current_owner_session(p_session_id, p_reason);
end;
$$;

create function public.revoke_all_current_user_sessions(
  p_reason text, p_owner_session_token_hash text
)
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not app_private.is_current_owner_session(p_owner_session_token_hash) then return 0; end if;
  return app_private.revoke_all_current_user_sessions(p_reason);
end;
$$;

revoke all on function public.list_platform_merchants(text) from public, anon, authenticated;
revoke all on function public.create_platform_merchant(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.issue_platform_merchant_invitation(uuid, text, timestamptz, text) from public, anon, authenticated;
revoke all on function public.revoke_platform_merchant_invitation(uuid, text) from public, anon, authenticated;
revoke all on function public.change_platform_merchant_status(uuid, text, text) from public, anon, authenticated;
revoke all on function public.list_current_user_application_sessions(text) from public, anon, authenticated;
revoke all on function public.revoke_current_owner_session(uuid, text, text) from public, anon, authenticated;
revoke all on function public.revoke_all_current_user_sessions(text, text) from public, anon, authenticated;

grant execute on function public.list_platform_merchants(text) to authenticated;
grant execute on function public.create_platform_merchant(text, text, text, text, text) to authenticated;
grant execute on function public.issue_platform_merchant_invitation(uuid, text, timestamptz, text) to authenticated;
grant execute on function public.revoke_platform_merchant_invitation(uuid, text) to authenticated;
grant execute on function public.change_platform_merchant_status(uuid, text, text) to authenticated;
grant execute on function public.list_current_user_application_sessions(text) to authenticated;
grant execute on function public.revoke_current_owner_session(uuid, text, text) to authenticated;
grant execute on function public.revoke_all_current_user_sessions(text, text) to authenticated;

drop policy businesses_select_authorised on public.businesses;
create policy businesses_select_authorised on public.businesses
for select to authenticated
using (app_private.current_user_has_active_membership(id));

commit;
