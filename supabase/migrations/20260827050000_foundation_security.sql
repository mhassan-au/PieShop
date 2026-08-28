begin;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique check (public_id ~ '^biz_[a-zA-Z0-9]{8,32}$'),
  name text not null check (char_length(name) between 1 and 120),
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  timezone text not null default 'Australia/Sydney' check (char_length(timezone) between 1 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null check (char_length(display_name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('merchant_owner', 'merchant_staff')),
  status text not null default 'active' check (status in ('active', 'suspended', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table public.platform_roles (
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('platform_owner', 'support_admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete restrict,
  email text not null check (char_length(email) between 3 and 320 and email = lower(email)),
  invited_role text not null check (invited_role in ('merchant_owner', 'merchant_staff', 'support_admin')),
  token_hash bytea not null unique check (octet_length(token_hash) = 32),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  used_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (revoked_at is null or used_at is null)
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete restrict,
  effective_business_id uuid references public.businesses(id) on delete restrict,
  event_type text not null check (event_type ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  target_type text,
  target_id text,
  request_id text,
  trace_id text,
  safe_context jsonb not null default '{}'::jsonb check (jsonb_typeof(safe_context) = 'object'),
  occurred_at timestamptz not null default now()
);

create table public.catalogue_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transaction_records (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  record_type text not null check (record_type ~ '^[a-z][a-z0-9_]*$'),
  occurred_at timestamptz not null default now(),
  safe_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(safe_payload) = 'object')
);

create index memberships_user_business_idx on public.memberships (user_id, business_id) where status = 'active';
create index catalogue_entries_business_idx on public.catalogue_entries (business_id);
create index transaction_records_business_idx on public.transaction_records (business_id, occurred_at desc);
create index audit_events_business_time_idx on public.audit_events (effective_business_id, occurred_at desc);

create function app_private.is_active_platform_owner(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_roles pr
    where pr.user_id = check_user_id
      and pr.role = 'platform_owner'
      and pr.is_active
  );
$$;

create function app_private.has_active_membership(check_user_id uuid, check_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.user_id = check_user_id
      and m.business_id = check_business_id
      and m.status = 'active'
  );
$$;

revoke all on function app_private.is_active_platform_owner(uuid) from public;
revoke all on function app_private.has_active_membership(uuid, uuid) from public;
grant usage on schema app_private to authenticated;
grant execute on function app_private.is_active_platform_owner(uuid) to authenticated;
grant execute on function app_private.has_active_membership(uuid, uuid) to authenticated;

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.platform_roles enable row level security;
alter table public.invitations enable row level security;
alter table public.audit_events enable row level security;
alter table public.catalogue_entries enable row level security;
alter table public.transaction_records enable row level security;

create policy businesses_select_authorised on public.businesses
for select to authenticated
using (
  app_private.is_active_platform_owner((select auth.uid()))
  or app_private.has_active_membership((select auth.uid()), id)
);

create policy profiles_select_self on public.profiles
for select to authenticated
using (user_id = (select auth.uid()));

create policy memberships_select_self on public.memberships
for select to authenticated
using (user_id = (select auth.uid()));

create policy platform_roles_select_self on public.platform_roles
for select to authenticated
using (user_id = (select auth.uid()));

create policy catalogue_entries_select_member on public.catalogue_entries
for select to authenticated
using (app_private.has_active_membership((select auth.uid()), business_id));

create policy catalogue_entries_insert_member on public.catalogue_entries
for insert to authenticated
with check (app_private.has_active_membership((select auth.uid()), business_id));

create policy catalogue_entries_update_member on public.catalogue_entries
for update to authenticated
using (app_private.has_active_membership((select auth.uid()), business_id))
with check (app_private.has_active_membership((select auth.uid()), business_id));

create policy transaction_records_select_member on public.transaction_records
for select to authenticated
using (app_private.has_active_membership((select auth.uid()), business_id));

create policy transaction_records_insert_member on public.transaction_records
for insert to authenticated
with check (app_private.has_active_membership((select auth.uid()), business_id));

revoke all on all tables in schema public from anon, authenticated;
grant select on public.businesses, public.profiles, public.memberships, public.platform_roles to authenticated;
grant select, insert, update on public.catalogue_entries to authenticated;
grant select, insert on public.transaction_records to authenticated;
revoke all on public.invitations, public.audit_events from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;

comment on table public.catalogue_entries is 'Part 0.4 tenant-content probe; expanded by catalogue milestones.';
comment on table public.transaction_records is 'Part 0.4 immutable transaction probe; replaced or expanded by order/payment migrations.';

commit;
