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

    if (protectedTables.length !== rlsTables.length) {
      fail("RLS is not enabled on every foundation table");
    } else if (triggers.length !== 2) {
      fail("immutable-record protection triggers are missing");
    } else if ((invitationChecks[0]?.count ?? 0) < 4) {
      fail("invitation hash/lifecycle constraints are incomplete");
    } else {
      process.stdout.write(
        "Foundation hardening check passed: RLS coverage, immutable-record triggers, and invitation constraints verified.\n",
      );
    }
  } catch {
    fail("database hardening query failed");
  } finally {
    await sql.end({ timeout: 1 });
  }
}
