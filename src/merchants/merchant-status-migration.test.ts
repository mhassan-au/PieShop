import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260906050000_merchant_status_transitions.sql",
  ),
  "utf8",
).toLowerCase();

describe("merchant status transition migration", () => {
  it("self-authorizes and enforces the locked transition graph", () => {
    expect(sql).toContain(
      "app_private.is_current_user_active_platform_owner()",
    );
    expect(sql).toContain("for update");
    for (const transition of [
      "onboarding:active",
      "onboarding:suspended",
      "active:suspended",
      "suspended:active",
      "suspended:archived",
    ])
      expect(sql).toContain(transition);
    expect(sql).not.toContain("delete from");
  });

  it("guards activation, revokes sessions, and writes a safe audit event", () => {
    expect(sql).toContain("i.invitation_status = 'used'");
    expect(sql).toContain("m.role = 'merchant_owner'");
    expect(sql).toContain("revoked_reason = 'suspension'");
    expect(sql).toContain("'merchant.status_changed'");
    expect(sql).toContain("'previous_status'");
    expect(sql).toContain("'next_status'");
    expect(sql).toMatch(
      /grant execute on function public\.change_platform_merchant_status\(uuid, text\)\s+to authenticated/u,
    );
  });
});
