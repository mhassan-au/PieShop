begin;

create function public.get_server_invitation_auth_target(p_token_hash_hex text)
returns table (recipient_email text)
language sql stable security definer set search_path = ''
as $$
  select i.email
  from public.invitations i
  join public.businesses b on b.id = i.business_id
  where p_token_hash_hex ~ '^[0-9a-f]{64}$'
    and i.token_hash = decode(p_token_hash_hex, 'hex')
    and i.invited_role = 'merchant_owner'
    and i.invitation_status = 'issued'
    and i.expires_at > statement_timestamp()
    and b.status = 'onboarding'
  limit 1;
$$;

revoke all on function public.get_server_invitation_auth_target(text)
  from public, anon, authenticated;
grant execute on function public.get_server_invitation_auth_target(text)
  to service_role;

commit;
