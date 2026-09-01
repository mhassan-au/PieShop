create function public.revoke_current_owner_session_by_token(p_token_hash text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  newly_revoked_id uuid;
begin
  if current_user_id is null then
    return false;
  end if;

  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid session credential hash' using errcode = '22023';
  end if;

  update public.application_sessions
  set revoked_at = now(), revoked_reason = 'logout'
  where token_hash = p_token_hash
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
      jsonb_build_object('reason', 'logout')
    );
  end if;

  return newly_revoked_id is not null;
end;
$$;

revoke all on function public.revoke_current_owner_session_by_token(text) from public, anon, authenticated;
grant execute on function public.revoke_current_owner_session_by_token(text) to authenticated;
