import postgres from "postgres";

const databaseUrl = process.env.SUPABASE_DB_URL;
const appEnvironment = process.env.APP_ENV;

function fail(message) {
  process.stderr.write(`Owner linkage check failed: ${message}\n`);
  process.exitCode = 1;
}

if (!databaseUrl) {
  fail("SUPABASE_DB_URL is missing");
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

      const [result] = await sql`
        select
          (select count(*)::integer from auth.users) as auth_user_count,
          (
            select count(*)::integer
            from public.platform_roles
            where role = 'platform_owner' and is_active
          ) as active_owner_role_count,
          (
            select count(*)::integer
            from public.platform_roles as role
            inner join auth.users as auth_user on auth_user.id = role.user_id
            where role.role = 'platform_owner' and role.is_active
          ) as linked_active_owner_count
      `;

      const summary = {
        authUsersExist: Number(result?.auth_user_count) > 0,
        exactlyOneAuthUser: Number(result?.auth_user_count) === 1,
        activeOwnerRoleExists: Number(result?.active_owner_role_count) > 0,
        activeOwnerIsLinked: Number(result?.linked_active_owner_count) > 0,
      };

      process.stdout.write(`Owner linkage check: ${JSON.stringify(summary)}\n`);
      if (!summary.activeOwnerIsLinked) {
        fail("no Auth user is linked to an active platform_owner role");
      }
    }
  } catch {
    fail("database connection or linkage query failed");
  } finally {
    if (sql) await sql.end({ timeout: 1 });
  }
}
