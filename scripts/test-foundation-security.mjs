import postgres from "postgres";

const databaseUrl = process.env.SUPABASE_DB_URL;
const appEnvironment = process.env.APP_ENV;

class RollbackAfterSuccess extends Error {}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function jwtFor(userId) {
  return JSON.stringify({
    sub: userId,
    role: "authenticated",
    aal: "aal2",
  });
}

if (!databaseUrl) {
  process.stderr.write(
    "Foundation security tests failed: SUPABASE_DB_URL is missing.\n",
  );
  process.exitCode = 1;
} else if (!new Set(["local", "test"]).has(appEnvironment)) {
  process.stderr.write(
    "Foundation security tests failed: APP_ENV must be local or test.\n",
  );
  process.exitCode = 1;
} else {
  const sql = postgres(databaseUrl, {
    connect_timeout: 10,
    idle_timeout: 2,
    max: 1,
    prepare: false,
    ssl: "require",
  });
  let assertions = 0;

  try {
    await sql.begin(async (tx) => {
      const merchantA = "10000000-0000-4000-8000-000000000001";
      const merchantB = "10000000-0000-4000-8000-000000000002";
      const platformOwner = "10000000-0000-4000-8000-000000000003";
      const businessA = "20000000-0000-4000-8000-000000000001";
      const businessB = "20000000-0000-4000-8000-000000000002";

      await tx`
        insert into auth.users (
          id, instance_id, aud, role, email, encrypted_password,
          email_confirmed_at, created_at, updated_at
        ) values
          (${merchantA}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'merchant-a@example.invalid', '', now(), now(), now()),
          (${merchantB}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'merchant-b@example.invalid', '', now(), now(), now()),
          (${platformOwner}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'platform@example.invalid', '', now(), now(), now())
      `;
      await tx`
        insert into public.businesses (id, public_id, name) values
          (${businessA}, 'biz_testA001', 'Synthetic Merchant A'),
          (${businessB}, 'biz_testB001', 'Synthetic Merchant B')
      `;
      await tx`
        insert into public.memberships (business_id, user_id, role) values
          (${businessA}, ${merchantA}, 'merchant_owner'),
          (${businessB}, ${merchantB}, 'merchant_owner')
      `;
      await tx`
        insert into public.platform_roles (user_id, role) values
          (${platformOwner}, 'platform_owner')
      `;
      await tx`
        insert into public.catalogue_entries (business_id, name) values
          (${businessA}, 'Synthetic A item'),
          (${businessB}, 'Synthetic B item')
      `;
      await tx`
        insert into public.transaction_records (business_id, record_type) values
          (${businessA}, 'synthetic_order'),
          (${businessB}, 'synthetic_order')
      `;
      await tx`
        insert into public.audit_events (actor_user_id, effective_business_id, event_type)
        values (${merchantA}, ${businessA}, 'security.synthetic_event')
      `;
      await tx`
        insert into public.invitations (
          business_id, email, invited_role, token_hash, issued_at, expires_at, created_by
        ) values (
          ${businessA},
          'invited@example.invalid',
          'merchant_staff',
          decode(repeat('ab', 32), 'hex'),
          now(),
          now() + interval '1 hour',
          ${platformOwner}
        )
      `;
      const [invitation] = await tx`
        select octet_length(token_hash) as hash_bytes, revoked_at, used_at
        from public.invitations
        where email = 'invited@example.invalid'
      `;
      assert(
        invitation?.hash_bytes === 32 &&
          invitation.revoked_at === null &&
          invitation.used_at === null,
        "invitation token was not stored as a 32-byte unused hash",
      );
      assertions += 1;

      await tx.unsafe(`
        do $test$
        begin
          begin
            insert into public.invitations (
              business_id, email, invited_role, token_hash, issued_at, expires_at, created_by
            ) values (
              '${businessA}', 'invalid-hash@example.invalid', 'merchant_staff',
              decode(repeat('cd', 31), 'hex'), now(), now() + interval '1 hour', '${platformOwner}'
            );
            raise exception 'short invitation hash unexpectedly succeeded';
          exception when check_violation then null;
          end;
          begin
            insert into public.invitations (
              business_id, email, invited_role, token_hash, issued_at, expires_at, created_by
            ) values (
              '${businessA}', 'expired@example.invalid', 'merchant_staff',
              decode(repeat('ef', 32), 'hex'), now(), now() - interval '1 hour', '${platformOwner}'
            );
            raise exception 'expired invitation unexpectedly succeeded';
          exception when check_violation then null;
          end;
          begin
            insert into public.invitations (
              business_id, email, invited_role, token_hash, issued_at, expires_at, created_by
            ) values (
              '${businessA}', 'duplicate@example.invalid', 'merchant_staff',
              decode(repeat('ab', 32), 'hex'), now(), now() + interval '1 hour', '${platformOwner}'
            );
            raise exception 'duplicate invitation hash unexpectedly succeeded';
          exception when unique_violation then null;
          end;
        end
        $test$;
      `);
      assertions += 1;

      await tx.unsafe(`
        do $test$
        begin
          begin
            update public.audit_events set event_type = 'security.rewrite_attempt';
            raise exception 'audit update unexpectedly succeeded';
          exception when sqlstate '55000' then null;
          end;
          begin
            delete from public.audit_events;
            raise exception 'audit delete unexpectedly succeeded';
          exception when sqlstate '55000' then null;
          end;
          begin
            update public.transaction_records set record_type = 'rewrite_attempt';
            raise exception 'transaction update unexpectedly succeeded';
          exception when sqlstate '55000' then null;
          end;
          begin
            delete from public.transaction_records;
            raise exception 'transaction delete unexpectedly succeeded';
          exception when sqlstate '55000' then null;
          end;
        end
        $test$;
      `);
      assertions += 1;

      const [anonPrivileges] = await tx`
        select
          has_table_privilege('anon', 'public.businesses', 'select') as can_read_businesses,
          has_table_privilege('anon', 'public.audit_events', 'select') as can_read_audit
      `;
      assert(
        anonPrivileges &&
          !anonPrivileges.can_read_businesses &&
          !anonPrivileges.can_read_audit,
        "unauthenticated role has protected-table privileges",
      );
      assertions += 1;

      await tx`select set_config('request.jwt.claims', ${jwtFor(merchantA)}, true)`;
      await tx.unsafe("set local role authenticated");
      const merchantBusinesses =
        await tx`select id from public.businesses order by id`;
      const merchantCatalogue =
        await tx`select business_id from public.catalogue_entries order by business_id`;
      const [merchantAuthorization] = await tx`
        select
          app_private.is_current_user_active_platform_owner() as is_platform_owner,
          app_private.current_user_has_active_membership(${businessA}) as has_own_membership,
          app_private.current_user_has_active_membership(${businessB}) as has_other_membership
      `;
      await tx.unsafe("reset role");
      assert(
        merchantBusinesses.length === 1 &&
          merchantBusinesses[0]?.id === businessA,
        "merchant crossed the business boundary",
      );
      assertions += 1;
      assert(
        merchantAuthorization &&
          !merchantAuthorization.is_platform_owner &&
          merchantAuthorization.has_own_membership &&
          !merchantAuthorization.has_other_membership,
        "authorization helpers are not bound to the current merchant identity",
      );
      assertions += 1;
      assert(
        merchantCatalogue.length === 1 &&
          merchantCatalogue[0]?.business_id === businessA,
        "merchant crossed the catalogue boundary",
      );
      assertions += 1;

      await tx`select set_config('request.jwt.claims', ${jwtFor(platformOwner)}, true)`;
      await tx.unsafe("set local role authenticated");
      const platformBusinesses = await tx`
        select id
        from public.businesses
        where id in (${businessA}, ${businessB})
      `;
      const platformCatalogue =
        await tx`select id from public.catalogue_entries`;
      const platformTransactions =
        await tx`select id from public.transaction_records`;
      const [platformAuthorization] = await tx`
        select
          app_private.is_current_user_active_platform_owner() as is_platform_owner,
          app_private.current_user_has_active_membership(${businessA}) as has_merchant_membership
      `;
      await tx.unsafe("reset role");
      assert(
        platformBusinesses.length === 2,
        "platform owner cannot read account metadata",
      );
      assertions += 1;
      assert(
        platformAuthorization &&
          platformAuthorization.is_platform_owner &&
          !platformAuthorization.has_merchant_membership,
        "platform authorization helper grants an unintended merchant membership",
      );
      assertions += 1;
      assert(
        platformCatalogue.length === 0,
        "platform owner can read merchant catalogue",
      );
      assertions += 1;
      assert(
        platformTransactions.length === 0,
        "platform owner can read merchant transactions",
      );
      assertions += 1;

      const [immutability] = await tx`
        select
          has_table_privilege('authenticated', 'public.audit_events', 'update') as audit_update,
          has_table_privilege('authenticated', 'public.audit_events', 'delete') as audit_delete,
          has_table_privilege('authenticated', 'public.transaction_records', 'update') as transaction_update,
          has_table_privilege('authenticated', 'public.transaction_records', 'delete') as transaction_delete
      `;
      assert(
        immutability &&
          !immutability.audit_update &&
          !immutability.audit_delete &&
          !immutability.transaction_update &&
          !immutability.transaction_delete,
        "application role can rewrite immutable records",
      );
      assertions += 1;

      throw new RollbackAfterSuccess();
    });
  } catch (error) {
    if (error instanceof RollbackAfterSuccess) {
      process.stdout.write(
        `Foundation security tests passed: ${assertions} isolation and immutability assertions passed; synthetic data rolled back.\n`,
      );
    } else {
      process.stderr.write(
        `Foundation security tests failed: ${error instanceof Error ? error.message : "unknown failure"}\n`,
      );
      process.exitCode = 1;
    }
  } finally {
    await sql.end({ timeout: 1 });
  }
}
