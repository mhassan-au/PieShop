import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(
  process.cwd(),
  "supabase/migrations/20260901030000_platform_merchant_dashboard.sql",
);

const readMigration = () =>
  fs.readFileSync(migrationPath, "utf8").toLowerCase();

describe("platform merchant dashboard migration", () => {
  it("represents onboarding merchants and token-free draft invitations", () => {
    const sql = readMigration();
    expect(sql).toContain(
      "status in ('onboarding', 'active', 'suspended', 'archived')",
    );
    expect(sql).toContain("currency_code text not null default 'aud'");
    expect(sql).toContain("invitation_status text not null default 'issued'");
    expect(sql).toContain("invitation_status = 'draft'");
    expect(sql).toMatch(
      /invitation_status = 'draft'[\s\S]*token_hash is null[\s\S]*expires_at is null/u,
    );
  });

  it("exposes narrowly granted self-authorizing list and create RPCs", () => {
    const sql = readMigration();
    for (const name of [
      "list_platform_merchants",
      "create_platform_merchant",
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

  it("serializes duplicate creation and audits only safe metadata", () => {
    const sql = readMigration();
    expect(sql).toContain("pg_advisory_xact_lock");
    expect(sql).toContain("'merchant.created'");
    expect(sql).toContain("actor_user_id");
    expect(sql).not.toMatch(/safe_context[^;]*(?:email|token_hash)/u);
  });

  it("returns only allow-listed merchant metadata", () => {
    const sql = readMigration();
    expect(sql).toContain("invitation_status");
    expect(sql).not.toMatch(
      /returns table[^$]*(?:catalogue|transaction|payment|bank|customer|address|message|order)/u,
    );
  });
});
