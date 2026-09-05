begin;

alter table public.invitations add column issued_at timestamptz;

alter table public.invitations drop constraint invitations_lifecycle_check;
alter table public.invitations add constraint invitations_lifecycle_check check (
  (invitation_status = 'draft' and token_hash is null and expires_at is null and issued_at is null and revoked_at is null and used_at is null)
  or (invitation_status = 'issued' and token_hash is not null and expires_at is not null and issued_at is not null and expires_at > issued_at and revoked_at is null and used_at is null)
  or (invitation_status = 'used' and token_hash is not null and expires_at is not null and issued_at is not null and used_at is not null and revoked_at is null)
  or (invitation_status = 'revoked' and revoked_at is not null and used_at is null)
);

create function public.issue_platform_merchant_invitation(
  p_business_id uuid, p_token_hash_hex text, p_expires_at timestamptz
)
returns table (business_id uuid, invitation_status text, issued_at timestamptz, expires_at timestamptz)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  invitation_row public.invitations%rowtype;
  issued_time timestamptz := statement_timestamp();
begin
  if current_user_id is null or not app_private.is_current_user_active_platform_owner() then return; end if;
  if p_token_hash_hex !~ '^[0-9a-f]{64}$'
    or p_expires_at <= statement_timestamp()
    or p_expires_at > statement_timestamp() + interval '24 hours 5 minutes' then
    raise exception 'Invitation unavailable' using errcode = '22023';
  end if;

  select i.* into invitation_row from public.invitations i
  join public.businesses b on b.id = i.business_id
  where i.business_id = p_business_id and i.invited_role = 'merchant_owner'
    and b.status = 'onboarding'
  for update of i;

  if not found or invitation_row.invitation_status = 'used' then
    raise exception 'Invitation unavailable' using errcode = 'P0002';
  end if;
  if invitation_row.invitation_status = 'issued'
    and invitation_row.issued_at > issued_time - interval '60 seconds' then
    raise exception 'Invitation unavailable' using errcode = '55000';
  end if;

  update public.invitations i set
    token_hash = decode(p_token_hash_hex, 'hex'), expires_at = p_expires_at,
    issued_at = issued_time, revoked_at = null, invitation_status = 'issued'
  where i.id = invitation_row.id;

  insert into public.audit_events (
    actor_user_id, effective_business_id, event_type, target_type, target_id, safe_context
  ) values (
    current_user_id, p_business_id, 'invitation.issued', 'invitation', invitation_row.id::text,
    jsonb_build_object('role', 'merchant_owner', 'result', 'issued')
  );

  return query select p_business_id, 'issued'::text, issued_time, p_expires_at;
end;
$$;

create function public.revoke_platform_merchant_invitation(p_business_id uuid)
returns table (business_id uuid, invitation_status text, revoked_at timestamptz)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  invitation_row public.invitations%rowtype;
  revoked_time timestamptz := statement_timestamp();
begin
  if current_user_id is null or not app_private.is_current_user_active_platform_owner() then return; end if;
  select i.* into invitation_row from public.invitations i
  where i.business_id = p_business_id and i.invited_role = 'merchant_owner'
  for update;
  if not found or invitation_row.invitation_status = 'used' then
    raise exception 'Invitation unavailable' using errcode = 'P0002';
  end if;
  if invitation_row.invitation_status <> 'revoked' then
    update public.invitations i set invitation_status = 'revoked', revoked_at = revoked_time
    where i.id = invitation_row.id;
    insert into public.audit_events (
      actor_user_id, effective_business_id, event_type, target_type, target_id, safe_context
    ) values (
      current_user_id, p_business_id, 'invitation.revoked', 'invitation', invitation_row.id::text,
      jsonb_build_object('role', 'merchant_owner', 'result', 'revoked')
    );
  else
    revoked_time := invitation_row.revoked_at;
  end if;
  return query select p_business_id, 'revoked'::text, revoked_time;
end;
$$;

revoke all on function public.issue_platform_merchant_invitation(uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.revoke_platform_merchant_invitation(uuid) from public, anon, authenticated;
grant execute on function public.issue_platform_merchant_invitation(uuid, text, timestamptz) to authenticated;
grant execute on function public.revoke_platform_merchant_invitation(uuid) to authenticated;

commit;
