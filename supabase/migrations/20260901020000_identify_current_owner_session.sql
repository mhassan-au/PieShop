create function public.list_current_user_application_sessions(p_current_token_hash text)
returns table (
  id uuid,
  device_label text,
  created_at timestamptz,
  last_activity_at timestamptz,
  absolute_expires_at timestamptz,
  idle_expires_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  is_current boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    return;
  end if;

  if p_current_token_hash is null or p_current_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid session credential hash' using errcode = '22023';
  end if;

  if not app_private.is_current_user_active_platform_owner() then
    return;
  end if;

  return query
  select
    s.id,
    s.device_label,
    s.created_at,
    s.last_activity_at,
    s.absolute_expires_at,
    s.idle_expires_at,
    s.revoked_at,
    s.revoked_reason,
    (s.token_hash = p_current_token_hash) as is_current
  from public.application_sessions as s
  where s.user_id = current_user_id
  order by s.created_at desc;
end;
$$;

revoke all on function public.list_current_user_application_sessions(text) from public, anon, authenticated;
grant execute on function public.list_current_user_application_sessions(text) to authenticated;
