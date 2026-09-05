import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(
  process.cwd(),
  "supabase/migrations/20260905010000_secure_merchant_invitation_lifecycle.sql",
);

const readMigration = () =>
  fs.readFileSync(migrationPath, "utf8").toLowerCase();

describe("secure merchant invitation lifecycle migration", () => {
  it("defines narrowly granted self-authorizing issue and revoke RPCs", () => {
    const sql = readMigration();
    for (const name of [
      "issue_platform_merchant_invitation",
      "revoke_platform_merchant_invitation",
    ]) {
      expect(sql).toContain(`function public.${name}`);
      expect(sql).toContain(`revoke all on function public.${name}`);
      expect(sql).toMatch(
        new RegExp(
          `grant execute on function public\\.${name}[^;]+to authenticated`,
          "u",
        ),
      );
    }
    expect(sql).toContain(
      "app_private.is_current_user_active_platform_owner()",
    );
    expect(sql).toContain("current_user_id uuid := (select auth.uid())");
  });

  it("accepts only a 32-byte hash and bounded future expiry", () => {
    const sql = readMigration();
    expect(sql).toContain("p_token_hash_hex !~ '^[0-9a-f]{64}$'");
    expect(sql).toContain("decode(p_token_hash_hex, 'hex')");
    expect(sql).toContain("p_expires_at > statement_timestamp()");
    expect(sql).toContain(
      "p_expires_at > statement_timestamp() + interval '24 hours 5 minutes'",
    );
  });

  it("rotates issued tokens, enforces cooldown, and never returns sensitive material", () => {
    const sql = readMigration();
    expect(sql).toContain("interval '60 seconds'");
    expect(sql).toContain("token_hash = decode(p_token_hash_hex, 'hex')");
    expect(sql).toContain("invitation.issued");
    expect(sql).toContain("invitation.revoked");
    expect(sql).not.toMatch(
      /returns table[^$]*(?:email|token_hash|created_by|user_id)/u,
    );
  });

  it("locks the invitation and refuses used invitations", () => {
    const sql = readMigration();
    expect(sql).toContain("for update");
    expect(sql).toContain("invitation_status = 'used'");
    expect(sql).toContain("raise exception 'invitation unavailable'");
  });
});
