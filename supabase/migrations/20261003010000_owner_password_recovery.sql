begin;

create function public.revoke_current_owner_sessions_for_recovery()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  revoked_count integer := 0;
begin
  current_user_id := (select auth.uid());
  if current_user_id is null or not exists (
    select 1
    from public.platform_roles pr
    where pr.user_id = current_user_id
      and pr.role = 'platform_owner'
      and pr.is_active
  ) then
    return 0;
  end if;

  update public.application_sessions s
  set revoked_at = statement_timestamp(), revoked_reason = 'recovery'
  where s.user_id = current_user_id
    and s.revoked_at is null;
  get diagnostics revoked_count = row_count;

  insert into public.audit_events (
    actor_user_id, event_type, target_type, target_id, safe_context
  ) values (
    null,
    'auth.recovery.sessions_revoked',
    'auth_user',
    current_user_id::text,
    jsonb_build_object('revoked_session_count', revoked_count)
  );

  return revoked_count;
end;
$$;

revoke all on function public.revoke_current_owner_sessions_for_recovery()
  from public, anon, authenticated;
grant execute on function public.revoke_current_owner_sessions_for_recovery()
  to authenticated;

commit;
