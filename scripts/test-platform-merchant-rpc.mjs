import postgres from "postgres";

class ExpectedRollback extends Error {}

const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false });

try {
  await sql.begin(async (tx) => {
    const [owner] = await tx`
      select user_id from public.platform_roles
      where role = 'platform_owner' and is_active
      order by created_at limit 1
    `;
    if (!owner) throw new Error("Active synthetic platform owner is missing");

    await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: owner.user_id, role: "authenticated" })}, true)`;
    await tx.unsafe("set local role authenticated");
    const rows = await tx`
      select * from public.create_platform_merchant(
        'Synthetic RPC Merchant', 'rpc-owner@example.test',
        'Australia/Sydney', 'AUD'
      )
    `;
    if (rows.length !== 1 || rows[0].status !== "onboarding") {
      throw new Error("Merchant RPC returned an invalid result");
    }
    const repeated = await tx`
      select * from public.create_platform_merchant(
        'Synthetic RPC Merchant', 'rpc-owner@example.test',
        'Australia/Sydney', 'AUD'
      )
    `;
    if (repeated.length !== 1 || repeated[0].id !== rows[0].id) {
      throw new Error("Merchant RPC retry was not idempotent");
    }
    throw new ExpectedRollback();
  });
} catch (error) {
  if (!(error instanceof ExpectedRollback)) {
    const code =
      typeof error === "object" && error && "code" in error
        ? error.code
        : "UNCLASSIFIED";
    throw new Error(`Platform merchant RPC check failed (${String(code)})`);
  }
} finally {
  await sql.end();
}

process.stdout.write(
  "Platform merchant RPC check passed; synthetic data rolled back.\n",
);
