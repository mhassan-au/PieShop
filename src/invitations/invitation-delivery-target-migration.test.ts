import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sql = fs.readFileSync(
  path.resolve(
    process.cwd(),
    "supabase/migrations/20260905040000_server_only_invitation_delivery_target.sql",
  ),
  "utf8",
);

describe("server-only invitation delivery target migration", () => {
  it("returns only minimal delivery fields for an onboarding owner invitation", () => {
    expect(sql).toContain(
      "returns table (recipient_email text, business_name text)",
    );
    expect(sql).toContain("i.invited_role = 'merchant_owner'");
    expect(sql).toContain("b.status = 'onboarding'");
    expect(sql).not.toMatch(/token_hash|expires_at|catalog|transaction/iu);
  });

  it("is callable only with the server service role", () => {
    expect(sql).toMatch(
      /revoke all on function public\.get_server_invitation_delivery_target\(uuid\)[\s\S]*from public, anon, authenticated/u,
    );
    expect(sql).toMatch(
      /grant execute on function public\.get_server_invitation_delivery_target\(uuid\)[\s\S]*to service_role/u,
    );
  });
});
