begin;

create function app_private.forbid_immutable_record_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'immutable_record_mutation_blocked';
end;
$$;

revoke all on function app_private.forbid_immutable_record_mutation() from public, anon, authenticated;

create trigger audit_events_forbid_mutation
before update or delete on public.audit_events
for each row execute function app_private.forbid_immutable_record_mutation();

create trigger transaction_records_forbid_mutation
before update or delete on public.transaction_records
for each row execute function app_private.forbid_immutable_record_mutation();

commit;
