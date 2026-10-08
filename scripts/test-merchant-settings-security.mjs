import { randomBytes, randomUUID } from "node:crypto";

import postgres from "postgres";

import {
  assertSafeSupabaseTestTarget,
  safeDatabaseFailure,
} from "./supabase-test-target.mjs";

const databaseUrl = process.env.SUPABASE_DB_URL;

class RollbackAfterSuccess extends Error {}
class InjectedRollbackFailure extends Error {}

function assert(condition, code) {
  if (!condition) throw new Error(code);
}

function jwtFor(userId) {
  return JSON.stringify({ sub: userId, role: "authenticated", aal: "aal2" });
}

function tokenHash() {
  return randomBytes(32).toString("hex");
}

function publicId() {
  return `biz_sh1${randomBytes(6).toString("hex")}`;
}

async function expectDatabaseDenial(tx, action, expectedMessage) {
  let denied = false;
  try {
    await tx.savepoint(async (savepoint) => {
      await action(savepoint);
    });
  } catch (error) {
    denied =
      expectedMessage === undefined ||
      (error instanceof Error && error.message.includes(expectedMessage));
  }
  assert(denied, "expected_database_denial_missing");
}

try {
  assertSafeSupabaseTestTarget({
    appEnvironment: process.env.APP_ENV ?? "",
    projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    databaseUrl: databaseUrl ?? "",
    projectConfirmation: process.env.SUPABASE_DESTRUCTIVE_CONFIRMATION ?? "",
  });
} catch (error) {
  process.stderr.write(
    `Merchant settings security tests failed: ${error instanceof Error ? error.message : "unsafe_target"}.\n`,
  );
  process.exitCode = 1;
}

if (!process.exitCode && databaseUrl) {
  const sql = postgres(databaseUrl, {
    connect_timeout: 10,
    idle_timeout: 2,
    max: 1,
    prepare: false,
    ssl: "require",
  });
  let assertions = 0;
  let stage = "connect";

  try {
    stage = "verify_failure_rollback";
    const rollbackBusinessId = randomUUID();
    try {
      await sql.begin(async (tx) => {
        await tx`
          insert into public.businesses (id, public_id, name, status, timezone, currency_code)
          values (${rollbackBusinessId}, ${publicId()}, 'SH1 Rollback Marker', 'onboarding', 'Australia/Sydney', 'AUD')
        `;
        throw new InjectedRollbackFailure();
      });
    } catch (error) {
      if (!(error instanceof InjectedRollbackFailure)) throw error;
    }
    const [rollbackMarker] = await sql`
      select count(*)::int as count
      from public.businesses
      where id = ${rollbackBusinessId}
    `;
    assert(rollbackMarker?.count === 0, "failure_rollback_failed");
    assertions += 1;

    await sql.begin(async (tx) => {
      const merchantA = randomUUID();
      const merchantB = randomUUID();
      const merchantStaff = randomUUID();
      const noMembershipUser = randomUUID();
      const platformOwner = randomUUID();
      const businessA = randomUUID();
      const businessB = randomUUID();
      const sessionA = tokenHash();
      const sessionB = tokenHash();
      const staffSession = tokenHash();
      const sessionTime = new Date();
      const sessionExpiry = new Date(
        sessionTime.getTime() + 30 * 24 * 60 * 60 * 1000,
      );

      stage = "create_identities";
      await tx`
        insert into auth.users (
          id, instance_id, aud, role, email, encrypted_password,
          email_confirmed_at, created_at, updated_at
        ) values
          (${merchantA}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${`sh1-${merchantA}@example.invalid`}, '', now(), now(), now()),
          (${merchantB}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${`sh1-${merchantB}@example.invalid`}, '', now(), now(), now()),
          (${merchantStaff}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${`sh1-${merchantStaff}@example.invalid`}, '', now(), now(), now()),
          (${noMembershipUser}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${`sh1-${noMembershipUser}@example.invalid`}, '', now(), now(), now()),
          (${platformOwner}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${`sh1-${platformOwner}@example.invalid`}, '', now(), now(), now())
      `;
      stage = "create_businesses";
      await tx`
        insert into public.businesses (id, public_id, name, status, timezone, currency_code)
        values
          (${businessA}, ${publicId()}, 'SH1 Synthetic Merchant A', 'onboarding', 'Australia/Sydney', 'AUD'),
          (${businessB}, ${publicId()}, 'SH1 Synthetic Merchant B', 'onboarding', 'Australia/Sydney', 'AUD')
      `;
      stage = "create_memberships";
      await tx`
        insert into public.memberships (business_id, user_id, role, status)
        values
          (${businessA}, ${merchantA}, 'merchant_owner', 'active'),
          (${businessB}, ${merchantB}, 'merchant_owner', 'active'),
          (${businessA}, ${merchantStaff}, 'merchant_staff', 'active')
      `;
      stage = "create_platform_role";
      await tx`
        insert into public.platform_roles (user_id, role, is_active)
        values (${platformOwner}, 'platform_owner', true)
      `;
      stage = "create_sessions";
      await tx`
        insert into public.merchant_application_sessions (
          user_id, business_id, token_hash, created_at, last_activity_at, absolute_expires_at
        ) values
          (${merchantA}, ${businessA}, ${sessionA}, ${sessionTime}, ${sessionTime}, ${sessionExpiry}),
          (${merchantB}, ${businessB}, ${sessionB}, ${sessionTime}, ${sessionTime}, ${sessionExpiry}),
          (${merchantStaff}, ${businessA}, ${staffSession}, ${sessionTime}, ${sessionTime}, ${sessionExpiry})
      `;
      stage = "verify_settings_provisioning";
      const [provisionedSettings] = await tx`
        select count(*)::int as count
        from public.merchant_settings
        where business_id in (${businessA}, ${businessB})
      `;
      assert(
        provisionedSettings?.count === 2,
        "merchant_settings_not_provisioned",
      );
      assertions += 1;

      stage = "configure_settings_fixtures";
      await tx`
        update public.merchant_settings
        set contact_email = case
              when business_id = ${businessA} then 'synthetic-a@example.invalid'
              else 'synthetic-b@example.invalid'
            end,
            contact_phone = case
              when business_id = ${businessA} then '+61400000001'
              else '+61400000002'
            end
        where business_id in (${businessA}, ${businessB})
      `;

      stage = "merchant_context";
      await tx`select set_config('request.jwt.claims', ${jwtFor(merchantA)}, true)`;
      await tx.unsafe("set local role authenticated");

      stage = "read_own_settings";
      const ownSettings = await tx`
        select * from public.get_current_merchant_settings(${sessionA})
      `;
      assert(
        ownSettings.length === 1 && ownSettings[0]?.business_id === businessA,
        "own_settings_read_failed",
      );
      assertions += 1;

      stage = "deny_cross_tenant";
      const crossTenant = await tx`
        select * from public.get_current_merchant_settings(${sessionB})
      `;
      assert(crossTenant.length === 0, "cross_tenant_session_accepted");
      assertions += 1;

      stage = "deny_cross_tenant_update";
      await expectDatabaseDenial(
        tx,
        (savepoint) => savepoint`
          select * from public.update_current_merchant_settings(
            'Denied Cross Tenant', 'denied@example.invalid', '+61400000009',
            'AUD', 'Australia/Sydney', 1, ${sessionB}
          )
        `,
        "merchant_access_denied",
      );
      assertions += 1;

      stage = "deny_malformed_session";
      const malformed = await tx`
        select * from public.get_current_merchant_settings(${"not-a-session"})
      `;
      assert(malformed.length === 0, "malformed_session_accepted");
      assertions += 1;

      stage = "check_direct_privileges";
      const [directPrivileges] = await tx`
        select
          has_table_privilege('authenticated', 'public.merchant_settings', 'select') as can_select,
          has_table_privilege('authenticated', 'public.merchant_settings', 'insert') as can_insert,
          has_table_privilege('authenticated', 'public.merchant_settings', 'update') as can_update,
          has_table_privilege('authenticated', 'public.merchant_settings', 'delete') as can_delete
      `;
      assert(
        directPrivileges &&
          !directPrivileges.can_select &&
          !directPrivileges.can_insert &&
          !directPrivileges.can_update &&
          !directPrivileges.can_delete,
        "direct_settings_privilege_present",
      );
      assertions += 1;

      stage = "update_settings";
      const updated = await tx`
        select * from public.update_current_merchant_settings(
          'SH1 Synthetic Merchant A Updated',
          'updated-a@example.invalid',
          '+61400000003',
          'AUD',
          'Australia/Sydney',
          1,
          ${sessionA}
        )
      `;
      assert(
        updated.length === 1 && updated[0]?.version === 2,
        "valid_update_failed",
      );
      assertions += 1;

      stage = "repeat_update_call";
      const repeated = await tx`
        select * from public.update_current_merchant_settings(
          'SH1 Synthetic Merchant A Updated',
          'updated-a@example.invalid',
          '+61400000003',
          'AUD',
          'Australia/Sydney',
          1,
          ${sessionA}
        )
      `;
      stage = "repeat_update_audit";
      await tx.unsafe("reset role");
      const [auditCount] = await tx`
        select count(*)::int as count
        from public.audit_events
        where effective_business_id = ${businessA}
          and event_type = 'merchant.settings_updated'
      `;
      stage = "repeat_update_assertion";
      assert(
        repeated.length === 1 &&
          repeated[0]?.version === 2 &&
          auditCount?.count === 1,
        "idempotent_update_failed",
      );
      assertions += 1;

      stage = "deny_stale_update";
      await tx`select set_config('request.jwt.claims', ${jwtFor(merchantA)}, true)`;
      await tx.unsafe("set local role authenticated");
      await expectDatabaseDenial(
        tx,
        (savepoint) => savepoint`
          select * from public.update_current_merchant_settings(
            'SH1 Stale Update', 'stale@example.invalid', '+61400000004',
            'AUD', 'Australia/Sydney', 1, ${sessionA}
          )
        `,
        "settings_conflict",
      );
      assertions += 1;

      stage = "deny_null_update";
      await expectDatabaseDenial(
        tx,
        (savepoint) => savepoint`
        select * from public.update_current_merchant_settings(
          ${null}, 'null-test@example.invalid', '+61400000005',
          'AUD', 'Australia/Sydney', 2, ${sessionA}
        )
      `,
      );
      assertions += 1;

      await tx.unsafe("reset role");

      stage = "deny_revoked_session";
      await tx`
        update public.merchant_application_sessions
        set revoked_at = created_at, revoked_reason = 'security_event'
        where token_hash = ${sessionA}
      `;
      await tx`select set_config('request.jwt.claims', ${jwtFor(merchantA)}, true)`;
      await tx.unsafe("set local role authenticated");
      const revokedRead = await tx`
        select * from public.get_current_merchant_settings(${sessionA})
      `;
      assert(revokedRead.length === 0, "revoked_session_accepted");
      assertions += 1;

      stage = "deny_suspended_business";
      await tx.unsafe("reset role");
      await tx`
        update public.merchant_application_sessions
        set revoked_at = null, revoked_reason = null
        where token_hash = ${sessionA}
      `;
      await tx`update public.businesses set status = 'suspended' where id = ${businessA}`;
      await tx`select set_config('request.jwt.claims', ${jwtFor(merchantA)}, true)`;
      await tx.unsafe("set local role authenticated");
      const suspendedRead = await tx`
        select * from public.get_current_merchant_settings(${sessionA})
      `;
      assert(suspendedRead.length === 0, "suspended_business_accepted");
      assertions += 1;

      stage = "deny_platform_owner";
      await tx.unsafe("reset role");
      await tx`select set_config('request.jwt.claims', ${jwtFor(platformOwner)}, true)`;
      await tx.unsafe("set local role authenticated");
      const platformRead = await tx`
        select * from public.get_current_merchant_settings(${sessionA})
      `;
      assert(platformRead.length === 0, "platform_owner_settings_access");
      assertions += 1;
      await tx.unsafe("reset role");

      stage = "deny_staff";
      await tx`select set_config('request.jwt.claims', ${jwtFor(merchantStaff)}, true)`;
      await tx.unsafe("set local role authenticated");
      const staffRead = await tx`
        select * from public.get_current_merchant_settings(${staffSession})
      `;
      assert(staffRead.length === 0, "merchant_staff_settings_access");
      assertions += 1;
      await tx.unsafe("reset role");

      stage = "deny_no_membership";
      await tx`select set_config('request.jwt.claims', ${jwtFor(noMembershipUser)}, true)`;
      await tx.unsafe("set local role authenticated");
      const noMembershipRead = await tx`
        select * from public.get_current_merchant_settings(${sessionA})
      `;
      assert(noMembershipRead.length === 0, "no_membership_settings_access");
      assertions += 1;
      await tx.unsafe("reset role");

      stage = "deny_anonymous";
      const [anonymousPrivilege] = await tx`
        select has_function_privilege(
          'anon',
          'public.get_current_merchant_settings(text)',
          'execute'
        ) as can_execute
      `;
      assert(
        !anonymousPrivilege?.can_execute,
        "anonymous_rpc_privilege_present",
      );
      assertions += 1;

      throw new RollbackAfterSuccess();
    });
  } catch (error) {
    if (error instanceof RollbackAfterSuccess) {
      process.stdout.write(
        `Merchant settings security tests passed: ${assertions} live authorization, persistence, and isolation assertions passed; synthetic data rolled back.\n`,
      );
    } else {
      process.stderr.write(
        `Merchant settings security tests failed: ${safeDatabaseFailure(error)}:${stage}.\n`,
      );
      process.exitCode = 1;
    }
  } finally {
    await sql.end({ timeout: 1 });
  }
}
