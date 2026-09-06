import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = fs.readFileSync(
  path.resolve(
    process.cwd(),
    "supabase/migrations/20260906030000_revoke_current_merchant_session.sql",
  ),
  "utf8",
);

describe("merchant exact-session logout migration", () => {
  it("binds revocation to auth uid and the supplied hash", () => {
    expect(sql).toContain("s.token_hash = p_token_hash");
    expect(sql).toContain("s.user_id = current_user_id");
    expect(sql).toContain("revoked_reason = 'logout'");
  });

  it("audits safely and grants authenticated only", () => {
    expect(sql).toContain("'auth.session.revoked'");
    expect(sql).toContain("jsonb_build_object('reason', 'logout')");
    expect(sql).toMatch(/grant execute[\s\S]*to authenticated/u);
  });
});
