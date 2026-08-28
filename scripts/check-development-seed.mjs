import postgres from "postgres";

const databaseUrl = process.env.SUPABASE_DB_URL;
const appEnvironment = process.env.APP_ENV;

function fail(message) {
  process.stderr.write(`Development seed check failed: ${message}\n`);
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
    const rows = await sql`
      select public_id, name, timezone
      from public.businesses
      where public_id = 'biz_seed0001'
    `;

    if (
      rows.length !== 1 ||
      rows[0]?.name !== "Synthetic Seed Merchant" ||
      rows[0]?.timezone !== "Australia/Sydney"
    ) {
      fail("deterministic synthetic business is missing or incorrect");
    } else {
      process.stdout.write(
        "Development seed check passed: deterministic synthetic business found.\n",
      );
    }
  } catch {
    fail("database seed query failed");
  } finally {
    await sql.end({ timeout: 1 });
  }
}
