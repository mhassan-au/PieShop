begin;

create or replace function public.redeem_merchant_invitation(
  p_token_hash_hex text, p_session_token_hash text
)
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
  on conflict on constraint memberships_business_id_user_id_key
  do update set role = 'merchant_owner', status = 'active', updated_at = redemption_time;

  insert into public.merchant_application_sessions (
    user_id, business_id, token_hash, created_at, last_activity_at, absolute_expires_at
  ) values (
    current_user_id, invitation_row.business_id, p_session_token_hash,
    redemption_time, redemption_time, redemption_time + interval '30 days'
  );

  update public.invitations set invitation_status = 'used', used_at = redemption_time
  where id = invitation_row.id;
  insert into public.audit_events (
    actor_user_id, effective_business_id, event_type, target_type, target_id, safe_context
  ) values (
    current_user_id, invitation_row.business_id, 'invitation.redeemed',
    'invitation', invitation_row.id::text,
    jsonb_build_object('role', 'merchant_owner', 'result', 'used')
  );
  return query select invitation_row.business_id, 'merchant_owner'::text;
end;
$$;

revoke all on function public.redeem_merchant_invitation(text, text)
  from public, anon, authenticated;
grant execute on function public.redeem_merchant_invitation(text, text)
  to authenticated;

commit;
