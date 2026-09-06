begin;

create function public.revoke_current_merchant_session(p_token_hash text)
returns boolean
language plpgsql volatile security definer set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  revoked_session public.merchant_application_sessions%rowtype;
begin
  if current_user_id is null then return false; end if;
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid session credential hash' using errcode = '22023';
  end if;

  update public.merchant_application_sessions s
  set revoked_at = statement_timestamp(), revoked_reason = 'logout'
  where s.token_hash = p_token_hash
    and s.user_id = current_user_id
    and s.revoked_at is null
  returning s.* into revoked_session;

  if revoked_session.id is not null then
    insert into public.audit_events (
      actor_user_id, effective_business_id, event_type,
      target_type, target_id, safe_context
    ) values (
      current_user_id, revoked_session.business_id, 'auth.session.revoked',
      'merchant_application_session', revoked_session.id::text,
      jsonb_build_object('reason', 'logout')
    );
  end if;
  return revoked_session.id is not null;
end;
$$;

revoke all on function public.revoke_current_merchant_session(text)
  from public, anon, authenticated;
grant execute on function public.revoke_current_merchant_session(text)
  to authenticated;

commit;
