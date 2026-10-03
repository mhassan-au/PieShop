import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repair = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260906070000_fix_merchant_settings_session_columns.sql",
  ),
  "utf8",
).toLowerCase();

describe("merchant settings session-column repair", () => {
  it("uses the canonical merchant application-session columns", () => {
    expect(repair).toContain("s.token_hash = p_session_token_hash");
    expect(repair).toContain("s.absolute_expires_at > now()");
    expect(repair).not.toContain("s.session_token_hash");
    expect(repair).not.toMatch(/s\.expires_at\b/u);
  });

  it("preserves session, owner, membership, and business checks", () => {
    expect(repair).toContain(
      "create or replace function app_private.current_merchant_owner_business_id",
    );
    expect(repair).toContain("m.role = 'merchant_owner'");
    expect(repair).toContain("m.status = 'active'");
    expect(repair).toContain("b.status in ('onboarding', 'active')");
    expect(repair).toContain("s.revoked_at is null");
    expect(repair).toContain("count(*) = 1");
  });
});
