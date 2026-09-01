import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(
  process.cwd(),
  "supabase/migrations/20260901010000_revoke_current_owner_session_by_token.sql",
);

function readMigration(): string {
  return fs.readFileSync(migrationPath, "utf8").toLowerCase();
}

describe("current owner logout migration", () => {
  it("revokes only the authenticated user's session matching a credential hash", () => {
    const sql = readMigration();

    expect(sql).toContain(
      "function public.revoke_current_owner_session_by_token",
    );
    expect(sql).toContain("current_user_id uuid := (select auth.uid())");
    expect(sql).toContain("token_hash = p_token_hash");
    expect(sql).toContain("user_id = current_user_id");
    expect(sql).toContain("revoked_at is null");
    expect(sql).not.toMatch(/\bdelete\s+from\b/u);
  });

  it("validates hash input and records an append-only logout audit event", () => {
    const sql = readMigration();

    expect(sql).toContain("p_token_hash !~ '^[a-f0-9]{64}$'");
    expect(sql).toContain("insert into public.audit_events");
    expect(sql).toContain("'auth.session.revoked'");
    expect(sql).toContain("jsonb_build_object('reason', 'logout')");
    expect(sql).not.toMatch(/safe_context[^;]*p_token_hash/u);
  });

  it("is narrowly exposed to authenticated callers", () => {
    const sql = readMigration();

    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain(
      "revoke all on function public.revoke_current_owner_session_by_token(text) from public, anon, authenticated",
    );
    expect(sql).toContain(
      "grant execute on function public.revoke_current_owner_session_by_token(text) to authenticated",
    );
  });
});
