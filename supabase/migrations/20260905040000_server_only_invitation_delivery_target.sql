begin;

create function public.get_server_invitation_delivery_target(p_business_id uuid)
returns table (recipient_email text, business_name text)
language sql stable security definer set search_path = ''
as $$
  select i.email, b.name
  from public.invitations i
  join public.businesses b on b.id = i.business_id
  where i.business_id = p_business_id
    and i.invited_role = 'merchant_owner'
    and i.invitation_status in ('draft', 'issued', 'revoked')
    and b.status = 'onboarding'
  limit 1;
$$;

revoke all on function public.get_server_invitation_delivery_target(uuid)
  from public, anon, authenticated;
grant execute on function public.get_server_invitation_delivery_target(uuid)
  to service_role;

commit;
