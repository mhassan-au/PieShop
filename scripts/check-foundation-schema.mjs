import postgres from "postgres";

const databaseUrl = process.env.SUPABASE_DB_URL;
const appEnvironment = process.env.APP_ENV;

const expectedTables = [
  "businesses",
  "profiles",
  "memberships",
  "platform_roles",
  "invitations",
  "audit_events",
];

function fail(message) {
  process.stderr.write(`Foundation schema check failed: ${message}\n`);
  process.exitCode = 1;
}

if (!databaseUrl) {
  fail("SUPABASE_DB_URL is missing from .env.local");
} else if (!new Set(["local", "test"]).has(appEnvironment)) {
  fail("APP_ENV must be local or test");
} else {
  let sql;

  try {
    const parsedDatabaseUrl = new URL(databaseUrl);
    const isSupabaseHost =
      parsedDatabaseUrl.hostname.endsWith(".pooler.supabase.com") ||
      /^db\.[a-z0-9]{20}\.supabase\.co$/u.test(parsedDatabaseUrl.hostname);

    if (!isSupabaseHost) {
      fail("database host is not an approved Supabase host");
    } else {
      sql = postgres(databaseUrl, {
        connect_timeout: 10,
        idle_timeout: 2,
        max: 1,
        prepare: false,
        ssl: "require",
      });

      const rows = await sql`
        select table_name
        from information_schema.tables
        where table_schema = 'public'
          and table_name = any(${expectedTables}::text[])
      `;
      const found = new Set(rows.map((row) => row.table_name));
      const missing = expectedTables.filter((table) => !found.has(table));

      if (missing.length > 0) {
        fail(`required tables are missing: ${missing.join(", ")}`);
      } else {
        process.stdout.write(
          `Foundation schema check passed: ${expectedTables.length} required tables found.\n`,
        );
      }
    }
  } catch (error) {
    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
    const safeErrorCode = /^[A-Z0-9_]{2,32}$/u.test(errorCode)
      ? errorCode
      : "UNCLASSIFIED";
    const errorName =
      error instanceof Error && /^[A-Za-z]+Error$/u.test(error.name)
        ? error.name
        : "Error";
    const safeReason =
      errorCode === "28P01"
        ? "database authentication failed; check the database password and URL encoding"
        : errorCode === "ENOTFOUND"
          ? "database hostname could not be resolved"
          : errorCode === "ECONNREFUSED"
            ? "database connection was refused"
            : errorCode === "ETIMEDOUT" ||
                (error instanceof Error && /timeout/iu.test(error.message))
              ? "database connection timed out"
              : errorCode === "42601"
                ? "schema probe SQL was rejected"
                : `database connection or schema query failed (${errorName}/${safeErrorCode})`;
    fail(safeReason);
  } finally {
    if (sql) await sql.end({ timeout: 1 });
  }
}
