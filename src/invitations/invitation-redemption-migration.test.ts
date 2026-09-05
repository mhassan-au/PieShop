import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = fs
  .readFileSync(
    path.resolve(
      process.cwd(),
      "supabase/migrations/20260905020000_secure_merchant_invitation_redemption.sql",
    ),
    "utf8",
  )
  .toLowerCase();

describe("invitation redemption migration", () => {
  it("keeps GET inspection read-only and limited to live onboarding invitations", () => {
    const inspect = sql.slice(
      sql.indexOf("create function public.inspect_merchant_invitation"),
      sql.indexOf("create function public.redeem_merchant_invitation"),
    );
    expect(inspect).toContain("language sql stable");
    expect(inspect).toContain("invitation_status = 'issued'");
    expect(inspect).toContain("expires_at > statement_timestamp()");
    expect(inspect).not.toMatch(/\b(insert|update|delete)\b/u);
  });

  it("binds redemption to the authenticated recipient and locks before mutation", () => {
    expect(sql).toContain("current_user_id uuid := (select auth.uid())");
    expect(sql).toContain(
      "select lower(u.email) into current_email from auth.users",
    );
    expect(sql).toContain("invitation_row.email <> current_email");
    expect(sql).toContain("for update of i");
  });

  it("atomically creates one membership, consumes once, and audits the real actor", () => {
    expect(sql).toContain("on conflict (business_id, user_id) do update");
    expect(sql).toContain("invitation_status = 'used'");
    expect(sql).toContain("'invitation.redeemed'");
    expect(sql).toContain("actor_user_id");
  });

  it("grants inspection publicly but redemption only to authenticated identities", () => {
    expect(sql).toMatch(
      /grant execute on function public\.inspect_merchant_invitation\(text\) to anon, authenticated/u,
    );
    expect(sql).toMatch(
      /grant execute on function public\.redeem_merchant_invitation\(text\) to authenticated/u,
    );
    expect(sql).not.toMatch(
      /grant execute on function public\.redeem_merchant_invitation\(text\) to anon/u,
    );
  });
});
