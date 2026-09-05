import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = fs
  .readFileSync(
    path.resolve(
      process.cwd(),
      "supabase/migrations/20260905030000_merchant_application_sessions.sql",
    ),
    "utf8",
  )
  .toLowerCase();

describe("merchant application session migration", () => {
  it("stores only hashed session identifiers with an exact 30-day deadline", () => {
    expect(sql).toContain("token_hash text not null unique");
    expect(sql).toContain(
      "absolute_expires_at = created_at + interval '30 days'",
    );
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("revoke all on public.merchant_application_sessions");
  });

  it("creates membership, session, consumption, and audit in one redemption transaction", () => {
    const redemption = sql.slice(
      sql.indexOf("create function public.redeem_merchant_invitation"),
      sql.indexOf("create function public.verify_current_merchant_session"),
    );
    expect(redemption).toContain("insert into public.memberships");
    expect(redemption).toContain(
      "insert into public.merchant_application_sessions",
    );
    expect(redemption).toContain("invitation_status = 'used'");
    expect(redemption).toContain("'invitation.redeemed'");
  });

  it("rechecks session, membership, and merchant status on every verification", () => {
    expect(sql).toContain("s.revoked_at is null");
    expect(sql).toContain("s.absolute_expires_at > statement_timestamp()");
    expect(sql).toContain("m.status = 'active'");
    expect(sql).toContain("b.status in ('onboarding', 'active')");
  });

  it("does not leave the earlier redemption signature callable", () => {
    expect(sql).toContain(
      "drop function public.redeem_merchant_invitation(text)",
    );
    expect(sql).toMatch(
      /grant execute on function public\.redeem_merchant_invitation\(text, text\) to authenticated/u,
    );
    expect(sql).not.toMatch(
      /grant execute on function public\.redeem_merchant_invitation\(text\) to authenticated/u,
    );
  });
});
