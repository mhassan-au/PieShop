insert into public.businesses (
  id,
  public_id,
  name,
  status,
  timezone
)
values (
  '30000000-0000-4000-8000-000000000001',
  'biz_seed0001',
  'Synthetic Seed Merchant',
  'active',
  'Australia/Sydney'
)
on conflict (public_id) do update
set
  name = excluded.name,
  status = excluded.status,
  timezone = excluded.timezone,
  updated_at = now();
