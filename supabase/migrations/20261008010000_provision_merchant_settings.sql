begin;

insert into public.merchant_settings (business_id)
select id from public.businesses
on conflict (business_id) do nothing;

create function app_private.provision_merchant_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.merchant_settings (business_id)
  values (new.id)
  on conflict (business_id) do nothing;

  return new;
end;
$$;

revoke all on function app_private.provision_merchant_settings()
from public, anon, authenticated;

create trigger businesses_provision_merchant_settings
after insert on public.businesses
for each row execute function app_private.provision_merchant_settings();

commit;
