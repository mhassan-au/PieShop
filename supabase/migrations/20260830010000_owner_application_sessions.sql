begin;

create table public.application_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  device_label text check (device_label is null or char_length(device_label) between 1 and 120),
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  absolute_expires_at timestamptz not null default (now() + interval '12 hours'),
  idle_expires_at timestamptz not null default (now() + interval '2 hours'),
  revoked_at timestamptz,
  revoked_reason text check (
    revoked_reason is null
    or revoked_reason in ('logout', 'owner_action', 'role_change', 'recovery', 'security_event')
  ),
  check (absolute_expires_at = created_at + interval '12 hours'),
  check (idle_expires_at = last_activity_at + interval '2 hours'),
  check (last_activity_at >= created_at),
  check (revoked_at is null or revoked_at >= created_at),
  check ((revoked_at is null) = (revoked_reason is null))
);

create index application_sessions_user_time_idx
on public.application_sessions (user_id, created_at desc);

alter table public.application_sessions enable row level security;

create policy application_sessions_select_self
on public.application_sessions
for select to authenticated
using (user_id = (select auth.uid()));

revoke all on public.application_sessions from anon, authenticated;

create function public.list_current_user_application_sessions()
returns table (
  id uuid,
  device_label text,
  created_at timestamptz,
  last_activity_at timestamptz,
  absolute_expires_at timestamptz,
  idle_expires_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    session.id,
    session.device_label,
    session.created_at,
    session.last_activity_at,
    session.absolute_expires_at,
    session.idle_expires_at,
    session.revoked_at,
    session.revoked_reason
  from public.application_sessions as session
  where session.user_id = (select auth.uid())
  order by session.created_at desc;
$$;

create function public.create_current_owner_session(
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
  current_user_id uuid := (select auth.uid());
  created_session_id uuid;
begin
  if current_user_id is null
    or not app_private.is_current_user_active_platform_owner()
  then
    raise exception 'Platform owner role required' using errcode = '42501';
  end if;

  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid session credential hash' using errcode = '22023';
  end if;

  insert into public.application_sessions (user_id, token_hash, device_label)
  values (current_user_id, p_token_hash, nullif(btrim(p_device_label), ''))
  returning id into created_session_id;

  insert into public.audit_events (
    actor_user_id,
    event_type,
    target_type,
    target_id,
    safe_context
  )
  values (
    current_user_id,
    'auth.session.created',
    'application_session',
    created_session_id::text,
    jsonb_build_object('authentication_assurance', 'aal1')
  );

  return created_session_id;
end;
$$;

create function public.touch_current_owner_session(p_token_hash text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  touched_session_id uuid;
begin
  if (select auth.uid()) is null
    or not app_private.is_current_user_active_platform_owner()
  then
    return false;
  end if;

  update public.application_sessions
  set
    last_activity_at = now(),
    idle_expires_at = now() + interval '2 hours'
  where user_id = (select auth.uid())
    and token_hash = p_token_hash
    and revoked_at is null
    and now() < absolute_expires_at
    and now() < idle_expires_at
  returning id into touched_session_id;

  return touched_session_id is not null;
end;
$$;

create function public.revoke_current_owner_session(
  p_session_id uuid,
  p_reason text default 'owner_action'
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  session_exists boolean;
  newly_revoked_id uuid;
begin
  if current_user_id is null then
    return false;
  end if;

  if p_reason not in ('logout', 'owner_action', 'role_change', 'recovery', 'security_event') then
    raise exception 'Invalid session revocation reason' using errcode = '22023';
  end if;

  select exists (
    select 1
    from public.application_sessions
    where id = p_session_id
      and user_id = current_user_id
  ) into session_exists;

  if not session_exists then
    return false;
  end if;

  update public.application_sessions
  set revoked_at = now(), revoked_reason = p_reason
  where id = p_session_id
    and user_id = current_user_id
    and revoked_at is null
  returning id into newly_revoked_id;

  if newly_revoked_id is not null then
    insert into public.audit_events (
      actor_user_id,
      event_type,
      target_type,
      target_id,
      safe_context
    )
    values (
      current_user_id,
      'auth.session.revoked',
      'application_session',
      newly_revoked_id::text,
      jsonb_build_object('reason', p_reason)
    );
  end if;

  return true;
end;
$$;

create function public.revoke_all_current_user_sessions(
  p_reason text default 'security_event'
)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  revoked_count integer;
begin
  if current_user_id is null then
    return 0;
  end if;

  if p_reason not in ('logout', 'owner_action', 'role_change', 'recovery', 'security_event') then
    raise exception 'Invalid session revocation reason' using errcode = '22023';
  end if;

  update public.application_sessions
  set revoked_at = now(), revoked_reason = p_reason
  where user_id = current_user_id
    and revoked_at is null;

  get diagnostics revoked_count = row_count;

  if revoked_count > 0 then
    insert into public.audit_events (
      actor_user_id,
      event_type,
      target_type,
      safe_context
    )
    values (
      current_user_id,
      'auth.session.revoked',
      'application_session_set',
      jsonb_build_object('reason', p_reason, 'revoked_count', revoked_count)
    );
  end if;

  return revoked_count;
end;
$$;

revoke all on function public.create_current_owner_session(text, text) from public, anon, authenticated;
revoke all on function public.list_current_user_application_sessions() from public, anon, authenticated;
revoke all on function public.touch_current_owner_session(text) from public, anon, authenticated;
revoke all on function public.revoke_current_owner_session(uuid, text) from public, anon, authenticated;
revoke all on function public.revoke_all_current_user_sessions(text) from public, anon, authenticated;

grant execute on function public.create_current_owner_session(text, text) to authenticated;
grant execute on function public.list_current_user_application_sessions() to authenticated;
grant execute on function public.touch_current_owner_session(text) to authenticated;
grant execute on function public.revoke_current_owner_session(uuid, text) to authenticated;
grant execute on function public.revoke_all_current_user_sessions(text) to authenticated;

commit;
