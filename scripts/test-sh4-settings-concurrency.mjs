import postgres from "postgres";

import {
  assertSafeSupabaseTestTarget,
  safeDatabaseCode,
  safeDatabaseFailure,
} from "./supabase-test-target.mjs";

const databaseUrl = process.env.SUPABASE_DB_URL;

class RollbackProbe extends Error {}

function assert(condition, code) {
  if (!condition) throw new Error(code);
}

function jwtFor(userId) {
  return JSON.stringify({ sub: userId, role: "authenticated", aal: "aal2" });
}

async function expectLockTimeout(action) {
  let locked = false;
  try {
    await action();
  } catch (error) {
    locked = safeDatabaseCode(error) === "55P03";
  }
  assert(locked, "expected_lock_wait_missing");
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
    `SH-4 concurrency tests failed: ${error instanceof Error ? error.message : "unsafe_target"}.\n`,
  );
  process.exitCode = 1;
}

if (!process.exitCode && databaseUrl) {
  const connectionOptions = {
    connect_timeout: 10,
    idle_timeout: 2,
    max: 1,
    prepare: false,
    ssl: "require",
  };
  const updateConnection = postgres(databaseUrl, connectionOptions);
  const statusConnection = postgres(databaseUrl, connectionOptions);
  let stage = "select_fixture";
  let assertions = 0;

  try {
    const [fixture] = await updateConnection`
      select
        s.user_id,
        s.business_id,
        s.token_hash,
        ms.version,
        b.name,
        b.currency_code,
        b.timezone
      from public.merchant_application_sessions s
      join public.memberships m
        on m.user_id = s.user_id
        and m.business_id = s.business_id
        and m.role = 'merchant_owner'
        and m.status = 'active'
      join public.businesses b
        on b.id = s.business_id
        and b.status in ('onboarding', 'active')
      join public.merchant_settings ms on ms.business_id = b.id
      where s.revoked_at is null
        and s.absolute_expires_at > statement_timestamp()
        and (
          select count(distinct m2.business_id)
          from public.memberships m2
          join public.businesses b2 on b2.id = m2.business_id
          where m2.user_id = s.user_id
            and m2.role = 'merchant_owner'
            and m2.status = 'active'
            and b2.status in ('onboarding', 'active')
        ) = 1
      order by s.created_at desc
      limit 1
    `;
    assert(fixture, "live_synthetic_merchant_fixture_missing");

    stage = "update_holds_business_lock";
    try {
      await updateConnection.begin(async (updateTx) => {
        await updateTx`select set_config('request.jwt.claims', ${jwtFor(fixture.user_id)}, true)`;
        await updateTx.unsafe("set local role authenticated");
        const acknowledgement = await updateTx`
          select * from public.update_current_merchant_settings(
            ${fixture.name}, 'sh4-lock@example.invalid', '+61400000077',
            ${fixture.currency_code}, ${fixture.timezone}, ${fixture.version},
            ${fixture.token_hash}
          )
        `;
        assert(acknowledgement.length === 1, "update_lock_probe_failed");

        await expectLockTimeout(() =>
          statusConnection.begin(async (statusTx) => {
            await statusTx.unsafe("set local lock_timeout = '250ms'");
            await statusTx`
              update public.businesses
              set status = status
              where id = ${fixture.business_id}
            `;
          }),
        );
        assertions += 1;
        throw new RollbackProbe();
      });
    } catch (error) {
      if (!(error instanceof RollbackProbe)) throw error;
    }

    stage = "suspension_holds_business_lock";
    try {
      await statusConnection.begin(async (statusTx) => {
        await statusTx`
          select id from public.businesses
          where id = ${fixture.business_id}
          for update
        `;

        await expectLockTimeout(() =>
          updateConnection.begin(async (updateTx) => {
            await updateTx`select set_config('request.jwt.claims', ${jwtFor(fixture.user_id)}, true)`;
            await updateTx.unsafe("set local role authenticated");
            await updateTx.unsafe("set local lock_timeout = '250ms'");
            await updateTx`
              select * from public.update_current_merchant_settings(
                ${fixture.name}, 'sh4-lock@example.invalid', '+61400000077',
                ${fixture.currency_code}, ${fixture.timezone}, ${fixture.version},
                ${fixture.token_hash}
              )
            `;
          }),
        );
        assertions += 1;
        throw new RollbackProbe();
      });
    } catch (error) {
      if (!(error instanceof RollbackProbe)) throw error;
    }

    process.stdout.write(
      `SH-4 settings concurrency tests passed: ${assertions} deterministic business-lock ordering assertions passed; all probe mutations rolled back.\n`,
    );
  } catch (error) {
    process.stderr.write(
      `SH-4 concurrency tests failed: ${safeDatabaseFailure(error)}:${stage}.\n`,
    );
    process.exitCode = 1;
  } finally {
    await Promise.all([
      updateConnection.end({ timeout: 1 }),
      statusConnection.end({ timeout: 1 }),
    ]);
  }
}
