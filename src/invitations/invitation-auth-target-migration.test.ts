import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = fs.readFileSync(
  path.resolve(
    process.cwd(),
    "supabase/migrations/20260906010000_server_invitation_auth_target.sql",
  ),
  "utf8",
);

describe("server invitation authentication target migration", () => {
  it("limits results to a live onboarding merchant-owner invitation", () => {
    expect(sql).toContain("returns table (recipient_email text)");
    expect(sql).toContain("i.invitation_status = 'issued'");
    expect(sql).toContain("i.expires_at > statement_timestamp()");
    expect(sql).toContain("b.status = 'onboarding'");
    expect(sql).not.toMatch(
      /business_name|token_hash\s+text|catalog|transaction/iu,
    );
  });

  it("denies browser roles and grants only service_role", () => {
    expect(sql).toMatch(/revoke all[\s\S]*from public, anon, authenticated/u);
    expect(sql).toMatch(/grant execute[\s\S]*to service_role/u);
  });
});
