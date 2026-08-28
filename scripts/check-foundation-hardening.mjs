import postgres from "postgres";

const databaseUrl = process.env.SUPABASE_DB_URL;
const appEnvironment = process.env.APP_ENV;

const rlsTables = [
  "businesses",
  "profiles",
  "memberships",
  "platform_roles",
  "invitations",
  "audit_events",
  "catalogue_entries",
  "transaction_records",
];

function fail(message) {
  process.stderr.write(`Foundation hardening check failed: ${message}\n`);
  process.exitCode = 1;
}

if (!databaseUrl) {
  fail("SUPABASE_DB_URL is missing");
} else if (!new Set(["local", "test"]).has(appEnvironment)) {
  fail("APP_ENV must be local or test");
} else {
  const sql = postgres(databaseUrl, {
    connect_timeout: 10,
    idle_timeout: 2,
    max: 1,
    prepare: false,
    ssl: "require",
  });

  try {
    const protectedTables = await sql`
      select c.relname as table_name
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = any(${rlsTables}::text[])
        and c.relrowsecurity
    `;
    const triggers = await sql`
      select distinct event_object_table as table_name, trigger_name
      from information_schema.triggers
      where trigger_schema = 'public'
        and trigger_name in (
          'audit_events_forbid_mutation',
          'transaction_records_forbid_mutation'
        )
    `;
    const invitationChecks = await sql`
      select count(*)::int as count
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = 'invitations'
        and c.contype in ('c', 'u')
    `;
    const authorizationHelpers = await sql`
      select
        p.proname as function_name,
        pg_get_function_identity_arguments(p.oid) as arguments
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'app_private'
        and p.proname in (
          'is_active_platform_owner',
          'has_active_membership',
          'is_current_user_active_platform_owner',
          'current_user_has_active_membership'
        )
      order by p.proname
    `;
    const helperSignatures = new Set(
      authorizationHelpers.map(
        (helper) => `${helper.function_name}(${helper.arguments})`,
      ),
    );
    const hasSafeAuthorizationHelpers =
      helperSignatures.has("is_current_user_active_platform_owner()") &&
      helperSignatures.has(
        "current_user_has_active_membership(check_business_id uuid)",
      ) &&
      !helperSignatures.has("is_active_platform_owner(check_user_id uuid)") &&
      !helperSignatures.has(
        "has_active_membership(check_user_id uuid, check_business_id uuid)",
      );

    if (protectedTables.length !== rlsTables.length) {
      fail("RLS is not enabled on every foundation table");
    } else if (triggers.length !== 2) {
      fail("immutable-record protection triggers are missing");
    } else if ((invitationChecks[0]?.count ?? 0) < 4) {
      fail("invitation hash/lifecycle constraints are incomplete");
    } else if (!hasSafeAuthorizationHelpers) {
      fail("authorization helpers accept caller-supplied user identities");
    } else {
      process.stdout.write(
        "Foundation hardening check passed: RLS coverage, self-bound authorization helpers, immutable-record triggers, and invitation constraints verified.\n",
      );
    }
  } catch {
    fail("database hardening query failed");
  } finally {
    await sql.end({ timeout: 1 });
  }
}
