import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(
  process.cwd(),
  "supabase/migrations/20260830010000_owner_application_sessions.sql",
);

function readMigration(): string {
  return fs.readFileSync(migrationPath, "utf8").toLowerCase();
}

describe("owner application session migration", () => {
  it("stores only hashed opaque credentials with exact deadlines", () => {
    const sql = readMigration();

    expect(sql).toContain("create table public.application_sessions");
    expect(sql).toMatch(/token_hash\s+text\s+not null\s+unique/u);
    expect(sql).toContain("token_hash ~ '^[a-f0-9]{64}$'");
    expect(sql).not.toMatch(/\braw_token\b|\bsession_token\b/u);
    expect(sql).toContain(
      "absolute_expires_at = created_at + interval '12 hours'",
    );
    expect(sql).toContain(
      "idle_expires_at = last_activity_at + interval '2 hours'",
    );
  });

  it("enables self-only RLS without direct mutation grants", () => {
    const sql = readMigration();

    expect(sql).toContain(
      "alter table public.application_sessions enable row level security",
    );
    expect(sql).toContain("using (user_id = (select auth.uid()))");
    expect(sql).toContain(
      "revoke all on public.application_sessions from anon, authenticated",
    );
    expect(sql).toContain(
      "function public.list_current_user_application_sessions()",
    );
    expect(sql).not.toContain(
      "create view public.current_user_application_sessions",
    );
    expect(sql).not.toMatch(
      /grant\s+(?:select|insert|update|delete|all)[^;]*public\.application_sessions[^;]*authenticated/u,
    );
  });

  it("provides self-bound owner session RPCs", () => {
    const sql = readMigration();

    for (const functionName of [
      "create_current_owner_session",
      "list_current_user_application_sessions",
      "touch_current_owner_session",
      "revoke_current_owner_session",
      "revoke_all_current_user_sessions",
    ]) {
      expect(sql).toContain(`function public.${functionName}`);
      expect(sql).toContain(`revoke all on function public.${functionName}`);
      expect(sql).toMatch(
        new RegExp(
          `grant execute on function public\\.${functionName}[^;]+to authenticated`,
          "u",
        ),
      );
    }

    expect(sql).toContain(
      "app_private.is_current_user_active_platform_owner()",
    );
    expect(sql).toContain("(select auth.uid())");
    expect(sql).not.toMatch(/create_current_owner_session\([^)]*user_id/u);
  });

  it("records append-only session audit events without credential material", () => {
    const sql = readMigration();

    expect(sql).toContain("insert into public.audit_events");
    expect(sql).toContain("'auth.session.created'");
    expect(sql).toContain("'auth.session.revoked'");
    expect(sql).not.toMatch(/safe_context[^;]*(?:token_hash|session_token)/u);
  });
});
