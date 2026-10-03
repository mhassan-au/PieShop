import { randomBytes, randomUUID } from "node:crypto";

import postgres from "postgres";

import {
  assertSafeSupabaseTestTarget,
  safeDatabaseCode,
  safeDatabaseFailure,
} from "./supabase-test-target.mjs";

const databaseUrl = process.env.SUPABASE_DB_URL;

class RollbackAfterSuccess extends Error {}

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
  return `biz_sh2${randomBytes(6).toString("hex")}`;
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
    `Owner exact-session security tests failed: ${error instanceof Error ? error.message : "unsafe_target"}.\n`,
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
    await sql.begin(async (tx) => {
      const ownerA = randomUUID();
      const ownerB = randomUUID();
      const merchant = randomUUID();
      const businessA = randomUUID();
      const businessB = randomUUID();
      const currentHash = tokenHash();
      const otherDeviceHash = tokenHash();
      const otherOwnerHash = tokenHash();

      stage = "fixtures";
      await tx`
        insert into auth.users (
          id, instance_id, aud, role, email, encrypted_password,
          email_confirmed_at, created_at, updated_at
        ) values
          (${ownerA}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${`sh2-${ownerA}@example.invalid`}, '', now(), now(), now()),
          (${ownerB}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${`sh2-${ownerB}@example.invalid`}, '', now(), now(), now()),
          (${merchant}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${`sh2-${merchant}@example.invalid`}, '', now(), now(), now())
      `;
      await tx`
        insert into public.platform_roles (user_id, role, is_active)
        values (${ownerA}, 'platform_owner', true), (${ownerB}, 'platform_owner', true)
      `;
      await tx`
        insert into public.businesses (id, public_id, name, status, timezone, currency_code)
        values
          (${businessA}, ${publicId()}, 'SH2 Synthetic Merchant A', 'onboarding', 'Australia/Sydney', 'AUD'),
          (${businessB}, ${publicId()}, 'SH2 Synthetic Merchant B', 'onboarding', 'Australia/Sydney', 'AUD')
      `;
      await tx`
        insert into public.memberships (business_id, user_id, role, status)
        values (${businessA}, ${merchant}, 'merchant_owner', 'active')
      `;
      const sessions = await tx`
        insert into public.application_sessions (
          user_id, token_hash, device_label, created_at, last_activity_at,
          absolute_expires_at, idle_expires_at
        ) values
          (${ownerA}, ${currentHash}, 'SH2 current', statement_timestamp() - interval '1 second', statement_timestamp() - interval '1 second', statement_timestamp() - interval '1 second' + interval '12 hours', statement_timestamp() - interval '1 second' + interval '2 hours'),
          (${ownerA}, ${otherDeviceHash}, 'SH2 other', statement_timestamp() - interval '1 second', statement_timestamp() - interval '1 second', statement_timestamp() - interval '1 second' + interval '12 hours', statement_timestamp() - interval '1 second' + interval '2 hours'),
          (${ownerB}, ${otherOwnerHash}, 'SH2 other owner', statement_timestamp() - interval '1 second', statement_timestamp() - interval '1 second', statement_timestamp() - interval '1 second' + interval '12 hours', statement_timestamp() - interval '1 second' + interval '2 hours')
        returning id, token_hash
      `;
      const otherDeviceId = sessions.find(
        (session) => session.token_hash === otherDeviceHash,
      )?.id;
      assert(otherDeviceId, "other_device_fixture_missing");

      stage = "valid_owner_list";
      await tx`select set_config('request.jwt.claims', ${jwtFor(ownerA)}, true)`;
      await tx.unsafe("set local role authenticated");
      const validRows = await tx`
        select id from public.list_platform_merchants(${currentHash})
        where id in (${businessA}, ${businessB})
      `;
      assert(validRows.length === 2, "valid_owner_list_denied");
      assertions += 1;

      stage = "wrong_session_denials";
      const unknownRows = await tx`
        select id from public.list_platform_merchants(${tokenHash()})
      `;
      const otherOwnerRows = await tx`
        select id from public.list_platform_merchants(${otherOwnerHash})
      `;
      assert(
        unknownRows.length === 0 && otherOwnerRows.length === 0,
        "foreign_session_accepted",
      );
      assertions += 1;

      stage = "session_list";
      const currentSessions = await tx`
        select id, is_current
        from public.list_current_user_application_sessions(${currentHash})
      `;
      assert(
        currentSessions.length === 2 &&
          currentSessions.filter((session) => session.is_current).length === 1,
        "session_list_not_exact_bound",
      );
      assertions += 1;

      stage = "revoke_other_session";
      const [revoked] = await tx`
        select public.revoke_current_owner_session(
          ${otherDeviceId}, 'owner_action', ${currentHash}
        ) as result
      `;
      stage = "verify_other_session_revocation";
      const sessionStates = await tx`
        select id, revoked_at, is_current
        from public.list_current_user_application_sessions(${currentHash})
      `;
      const currentSession = sessionStates.find(
        (session) => session.is_current,
      );
      const otherSession = sessionStates.find(
        (session) => session.id === otherDeviceId,
      );
      assert(
        revoked?.result === true &&
          currentSession?.revoked_at === null &&
          otherSession?.revoked_at !== null,
        "other_session_revocation_failed",
      );
      assertions += 1;

      stage = "deny_status_mutation";
      const [deniedStatus] = await tx`
        select public.change_platform_merchant_status(
          ${businessA}, 'suspended', ${tokenHash()}
        ) as result
      `;
      await tx.unsafe("reset role");
      const [businessState] = await tx`
        select status from public.businesses where id = ${businessA}
      `;
      const [statusAudits] = await tx`
        select count(*)::int as count from public.audit_events
        where effective_business_id = ${businessA}
          and event_type = 'merchant.status_changed'
      `;
      assert(
        deniedStatus?.result === false &&
          businessState?.status === "onboarding" &&
          statusAudits?.count === 0,
        "denied_status_mutated_state",
      );
      assertions += 1;

      stage = "revoked_current_denial";
      await tx`
        update public.application_sessions
        set revoked_at = created_at, revoked_reason = 'security_event'
        where token_hash = ${currentHash}
      `;
      await tx`select set_config('request.jwt.claims', ${jwtFor(ownerA)}, true)`;
      await tx.unsafe("set local role authenticated");
      const revokedRows = await tx`
        select id from public.list_platform_merchants(${currentHash})
      `;
      assert(revokedRows.length === 0, "revoked_current_session_accepted");
      assertions += 1;

      stage = "inactive_role_denial";
      await tx.unsafe("reset role");
      await tx`
        update public.application_sessions
        set revoked_at = null, revoked_reason = null
        where token_hash = ${currentHash}
      `;
      await tx`
        update public.platform_roles set is_active = false
        where user_id = ${ownerA} and role = 'platform_owner'
      `;
      await tx`select set_config('request.jwt.claims', ${jwtFor(ownerA)}, true)`;
      await tx.unsafe("set local role authenticated");
      const inactiveRows = await tx`
        select id from public.list_platform_merchants(${currentHash})
      `;
      assert(inactiveRows.length === 0, "inactive_owner_role_accepted");
      assertions += 1;

      stage = "direct_business_privacy";
      const ownerDirectRows = await tx`
        select id from public.businesses where id in (${businessA}, ${businessB})
      `;
      assert(
        ownerDirectRows.length === 0,
        "owner_direct_business_read_present",
      );
      assertions += 1;

      stage = "merchant_membership_preserved";
      await tx`select set_config('request.jwt.claims', ${jwtFor(merchant)}, true)`;
      const merchantRows = await tx`
        select id from public.businesses where id in (${businessA}, ${businessB})
      `;
      const merchantOwnerRpc = await tx`
        select id from public.list_platform_merchants(${currentHash})
      `;
      assert(
        merchantRows.length === 1 &&
          merchantRows[0]?.id === businessA &&
          merchantOwnerRpc.length === 0,
        "merchant_policy_or_owner_rpc_boundary_failed",
      );
      assertions += 1;
      await tx.unsafe("reset role");

      stage = "obsolete_public_signatures";
      const [obsolete] = await tx`
        select
          to_regprocedure('public.list_platform_merchants()') is null as list_removed,
          to_regprocedure('public.create_platform_merchant(text,text,text,text)') is null as create_removed,
          to_regprocedure('public.issue_platform_merchant_invitation(uuid,text,timestamptz)') is null as issue_removed,
          to_regprocedure('public.revoke_platform_merchant_invitation(uuid)') is null as invitation_revoke_removed,
          to_regprocedure('public.change_platform_merchant_status(uuid,text)') is null as status_removed,
          to_regprocedure('public.revoke_current_owner_session(uuid,text)') is null as session_revoke_removed
      `;
      assert(
        obsolete && Object.values(obsolete).every(Boolean),
        "obsolete_public_signature_present",
      );
      assertions += 1;

      throw new RollbackAfterSuccess();
    });
  } catch (error) {
    if (error instanceof RollbackAfterSuccess) {
      process.stdout.write(
        `Owner exact-session security tests passed: ${assertions} direct authorization, privacy, revocation, and immutability assertions passed; synthetic data rolled back.\n`,
      );
    } else {
      const databaseCode = safeDatabaseCode(error);
      process.stderr.write(
        `Owner exact-session security tests failed: ${safeDatabaseFailure(error)}:${stage}${databaseCode ? `:${databaseCode}` : ""}.\n`,
      );
      process.exitCode = 1;
    }
  } finally {
    await sql.end({ timeout: 1 });
  }
}
