import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260906040000_returning_merchant_magic_link.sql",
  ),
  "utf8",
).toLowerCase();

describe("returning merchant magic-link migration", () => {
  it("limits email eligibility lookup to the server role and active owners", () => {
    expect(sql).toContain("resolve_merchant_magic_link_target");
    expect(sql).toContain("m.role = 'merchant_owner'");
    expect(sql).toContain("m.status = 'active'");
    expect(sql).toContain("b.status in ('onboarding', 'active')");
    expect(sql).toMatch(
      /grant execute on function public\.resolve_merchant_magic_link_target\(text\)\s+to service_role/u,
    );
    expect(sql).not.toMatch(
      /grant execute on function public\.resolve_merchant_magic_link_target\(text\)\s+to (anon|authenticated)/u,
    );
  });

  it("starts a 30-day session only for exactly one active merchant membership", () => {
    expect(sql).toContain("start_current_merchant_session");
    expect(sql).toContain("array_length(eligible_business_ids, 1) <> 1");
    expect(sql).toContain("login_time + interval '30 days'");
    expect(sql).toContain("'auth.session.created'");
    expect(sql).toMatch(
      /grant execute on function public\.start_current_merchant_session\(text\)\s+to authenticated/u,
    );
  });
});
