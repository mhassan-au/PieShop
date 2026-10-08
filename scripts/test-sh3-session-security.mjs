import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import postgres from "postgres";

import {
  assertSafeSupabaseTestTarget,
  safeDatabaseCode,
  safeDatabaseFailure,
} from "./supabase-test-target.mjs";

const databaseUrl = process.env.SUPABASE_DB_URL;
const migrationPath = path.resolve(
  "supabase/migrations/20261004010000_fresh_session_creation_and_legacy_access.sql",
);

class RollbackAfterSuccess extends Error {}

function assert(condition, code) {
  if (!condition) throw new Error(code);
}

function tokenHash() {
  return randomBytes(32).toString("hex");
}

function jwtFor({ userId, providerSessionId, method, authenticatedAt }) {
  return JSON.stringify({
    sub: userId,
    role: "authenticated",
    aal: "aal1",
    session_id: providerSessionId,
    amr: [{ method, timestamp: Math.floor(authenticatedAt.getTime() / 1000) }],
  });
}

function migrationBody(source) {
  return source.replace(/^\s*begin;\s*/iu, "").replace(/\s*commit;\s*$/iu, "");
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
    `SH-3 session security tests failed: ${error instanceof Error ? error.message : "unsafe_target"}.\n`,
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
  let stage = "read_migration";
  let migrationAlreadyApplied = false;

  try {
    const migration = migrationBody(await readFile(migrationPath, "utf8"));
    const [migrationState] = await sql`
      select to_regprocedure(
        'public.create_current_owner_session_from_password(text,text)'
      ) is not null as applied
    `;
    migrationAlreadyApplied = migrationState?.applied === true;

    await sql.begin(async (tx) => {
      if (!migrationAlreadyApplied) {
        stage = "apply_migration_in_rollback";
        await tx.unsafe(migration);
      }

      const ownerId = randomUUID();
      const merchantId = randomUUID();
      const businessId = randomUUID();
      const ownerProviderSessionId = randomUUID();
      const merchantProviderSessionId = randomUUID();
      const recoveryProviderSessionId = randomUUID();
      const authenticatedAt = new Date(Date.now() - 30_000);
      const ownerHash = tokenHash();
      const merchantHash = tokenHash();

      stage = "fixtures";
      await tx`
        insert into auth.users (
          id, instance_id, aud, role, email, encrypted_password,
          email_confirmed_at, created_at, updated_at
        ) values
          (${ownerId}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${`sh3-owner-${ownerId}@example.invalid`}, '', now(), now(), now()),
          (${merchantId}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${`sh3-merchant-${merchantId}@example.invalid`}, '', now(), now(), now())
      `;
      await tx`
        insert into auth.sessions (id, user_id, created_at, updated_at)
        values
          (${ownerProviderSessionId}, ${ownerId}, ${authenticatedAt}, ${authenticatedAt}),
          (${merchantProviderSessionId}, ${merchantId}, ${authenticatedAt}, ${authenticatedAt}),
          (${recoveryProviderSessionId}, ${ownerId}, ${authenticatedAt}, ${authenticatedAt})
      `;
      await tx`
        insert into public.platform_roles (user_id, role, is_active)
        values (${ownerId}, 'platform_owner', true)
      `;
      await tx`
        insert into public.businesses (
          id, public_id, name, status, timezone, currency_code
        ) values (
          ${businessId}, ${`biz_sh3${randomBytes(6).toString("hex")}`},
          'SH3 Synthetic Merchant', 'active', 'Australia/Sydney', 'AUD'
        )
      `;
      await tx`
        insert into public.memberships (business_id, user_id, role, status)
        values (${businessId}, ${merchantId}, 'merchant_owner', 'active')
      `;

      stage = "owner_fresh_password_creation";
      await tx`select set_config('request.jwt.claims', ${jwtFor({ userId: ownerId, providerSessionId: ownerProviderSessionId, method: "password", authenticatedAt })}, true)`;
      await tx.unsafe("set local role authenticated");
      const [createdOwner] = await tx`
        select public.create_current_owner_session_from_password(
          ${ownerHash}, 'SH3 synthetic owner'
        ) as id
      `;
      const [retriedOwner] = await tx`
        select public.create_current_owner_session_from_password(
          ${ownerHash}, 'SH3 synthetic owner'
        ) as id
      `;
      await tx.unsafe("reset role");
      const [ownerSession] = await tx`
        select id, created_at, absolute_expires_at, provider_session_id,
          authentication_method
        from public.application_sessions
        where token_hash = ${ownerHash}
      `;
      assert(
        createdOwner?.id &&
          createdOwner.id === retriedOwner?.id &&
          ownerSession?.provider_session_id === ownerProviderSessionId &&
          ownerSession.authentication_method === "password" &&
          ownerSession.absolute_expires_at.getTime() ===
            ownerSession.created_at.getTime() + 12 * 60 * 60 * 1000,
        "owner_binding_or_idempotency_failed",
      );
      assertions += 1;

      stage = "owner_conflicting_hash_denial";
      await tx`select set_config('request.jwt.claims', ${jwtFor({ userId: ownerId, providerSessionId: ownerProviderSessionId, method: "password", authenticatedAt })}, true)`;
      await tx.unsafe("set local role authenticated");
      const [conflictingOwner] = await tx`
        select public.create_current_owner_session_from_password(
          ${tokenHash()}, 'SH3 conflicting owner'
        ) as id
      `;
      await tx.unsafe("reset role");
      assert(conflictingOwner?.id === null, "owner_conflicting_hash_accepted");
      assertions += 1;

      stage = "recovery_denial";
      await tx`select set_config('request.jwt.claims', ${jwtFor({ userId: ownerId, providerSessionId: recoveryProviderSessionId, method: "recovery", authenticatedAt })}, true)`;
      await tx.unsafe("set local role authenticated");
      const [recoveryResult] = await tx`
        select public.create_current_owner_session_from_password(
          ${tokenHash()}, 'SH3 recovery denial'
        ) as id
      `;
      await tx.unsafe("reset role");
      assert(recoveryResult?.id === null, "recovery_created_owner_session");
      assertions += 1;

      stage = "merchant_magic_link_creation";
      await tx`select set_config('request.jwt.claims', ${jwtFor({ userId: merchantId, providerSessionId: merchantProviderSessionId, method: "magiclink", authenticatedAt })}, true)`;
      await tx.unsafe("set local role authenticated");
      const merchantRows = await tx`
        select * from public.start_current_merchant_session_from_magic_link(
          ${merchantHash}
        )
      `;
      const merchantRetryRows = await tx`
        select * from public.start_current_merchant_session_from_magic_link(
          ${merchantHash}
        )
      `;
      await tx.unsafe("reset role");
      const [merchantSession] = await tx`
        select created_at, absolute_expires_at, provider_session_id,
          authentication_method
        from public.merchant_application_sessions
        where token_hash = ${merchantHash}
      `;
      assert(
        merchantRows.length === 1 &&
          merchantRetryRows.length === 1 &&
          merchantRows[0]?.business_id === businessId &&
          merchantSession?.provider_session_id === merchantProviderSessionId &&
          merchantSession.authentication_method === "magiclink" &&
          merchantSession.absolute_expires_at.getTime() ===
            merchantSession.created_at.getTime() + 30 * 24 * 60 * 60 * 1000,
        "merchant_binding_or_idempotency_failed",
      );
      assertions += 1;

      stage = "audit_safety";
      const [sessionAudits] = await tx`
        select count(*)::int as count,
          bool_or(safe_context::text like ${`%${ownerProviderSessionId}%`}) as owner_provider_leaked,
          bool_or(safe_context::text like ${`%${merchantProviderSessionId}%`}) as merchant_provider_leaked,
          bool_or(safe_context::text like ${`%${ownerHash}%`}) as owner_hash_leaked,
          bool_or(safe_context::text like ${`%${merchantHash}%`}) as merchant_hash_leaked
        from public.audit_events
        where event_type = 'auth.session.created'
          and actor_user_id in (${ownerId}, ${merchantId})
      `;
      assert(
        sessionAudits?.count === 2 &&
          !sessionAudits.owner_provider_leaked &&
          !sessionAudits.merchant_provider_leaked &&
          !sessionAudits.owner_hash_leaked &&
          !sessionAudits.merchant_hash_leaked,
        "session_audit_count_or_redaction_failed",
      );
      assertions += 1;

      stage = "legacy_privilege_removal";
      const [privileges] = await tx`
        select
          has_function_privilege('authenticated', 'public.create_current_owner_session(text,text)', 'execute') as old_owner_execute,
          has_function_privilege('authenticated', 'public.start_current_merchant_session(text)', 'execute') as old_merchant_execute,
          has_function_privilege('authenticated', 'public.redeem_merchant_invitation(text,text)', 'execute') as old_redemption_execute,
          has_function_privilege('anon', 'public.create_current_owner_session_from_password(text,text)', 'execute') as anon_new_owner_execute,
          has_function_privilege('anon', 'public.start_current_merchant_session_from_magic_link(text)', 'execute') as anon_new_merchant_execute,
          has_function_privilege('authenticated', 'public.create_current_owner_session_from_password(text,text)', 'execute') as authenticated_new_owner_execute,
          has_function_privilege('authenticated', 'public.start_current_merchant_session_from_magic_link(text)', 'execute') as authenticated_new_merchant_execute,
          has_table_privilege('authenticated', 'public.catalogue_entries', 'select') as catalogue_select,
          has_table_privilege('authenticated', 'public.catalogue_entries', 'insert') as catalogue_insert,
          has_table_privilege('authenticated', 'public.catalogue_entries', 'update') as catalogue_update,
          has_table_privilege('authenticated', 'public.transaction_records', 'select') as transaction_select,
          has_table_privilege('authenticated', 'public.transaction_records', 'insert') as transaction_insert
      `;
      assert(
        privileges &&
          !privileges.old_owner_execute &&
          !privileges.old_merchant_execute &&
          !privileges.old_redemption_execute &&
          !privileges.anon_new_owner_execute &&
          !privileges.anon_new_merchant_execute &&
          privileges.authenticated_new_owner_execute &&
          privileges.authenticated_new_merchant_execute &&
          !privileges.catalogue_select &&
          !privileges.catalogue_insert &&
          !privileges.catalogue_update &&
          !privileges.transaction_select &&
          !privileges.transaction_insert,
        "legacy_or_new_function_privilege_boundary_failed",
      );
      assertions += 1;

      stage = "policy_removal";
      const [policyCount] = await tx`
        select count(*)::int as count
        from pg_policies
        where schemaname = 'public'
          and tablename in ('catalogue_entries', 'transaction_records')
      `;
      assert(policyCount?.count === 0, "legacy_policy_present");
      assertions += 1;

      throw new RollbackAfterSuccess();
    });
  } catch (error) {
    if (error instanceof RollbackAfterSuccess) {
      process.stdout.write(
        `SH-3 session security tests passed: ${assertions} fresh-authentication, idempotency, audit, and privilege assertions passed; ${migrationAlreadyApplied ? "synthetic data rolled back against the applied migration" : "migration and synthetic data rolled back"}.\n`,
      );
    } else {
      const databaseCode = safeDatabaseCode(error);
      process.stderr.write(
        `SH-3 session security tests failed: ${safeDatabaseFailure(error)}:${stage}${databaseCode ? `:${databaseCode}` : ""}.\n`,
      );
      process.exitCode = 1;
    }
  } finally {
    await sql.end({ timeout: 1 });
  }
}
