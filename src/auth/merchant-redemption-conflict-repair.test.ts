import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = fs.readFileSync(
  path.resolve(
    process.cwd(),
    "supabase/migrations/20260906020000_fix_merchant_redemption_conflict_target.sql",
  ),
  "utf8",
);

describe("merchant redemption conflict-target repair", () => {
  it("uses the named uniqueness constraint instead of ambiguous output-column names", () => {
    expect(sql).toContain(
      "on conflict on constraint memberships_business_id_user_id_key",
    );
    expect(sql).not.toContain("on conflict (business_id, user_id)");
  });

  it("preserves recipient binding, atomic session creation, audit, and narrow grant", () => {
    expect(sql).toContain("invitation_row.email <> current_email");
    expect(sql).toContain("insert into public.merchant_application_sessions");
    expect(sql).toContain("'invitation.redeemed'");
    expect(sql).toMatch(/grant execute[\s\S]*to authenticated/u);
  });
});
