import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(
  process.cwd(),
  "supabase/migrations/20260901020000_identify_current_owner_session.sql",
);

function readMigration(): string {
  return fs.readFileSync(migrationPath, "utf8").toLowerCase();
}

describe("current owner session identification migration", () => {
  it("returns only safe self-bound metadata plus a current-session flag", () => {
    const sql = readMigration();

    expect(sql).toContain(
      "function public.list_current_user_application_sessions(p_current_token_hash text)",
    );
    expect(sql).toContain("user_id = current_user_id");
    expect(sql).toContain(
      "(s.token_hash = p_current_token_hash) as is_current",
    );
    expect(sql).not.toMatch(/returns table[^$]*token_hash/u);
  });

  it("validates the hash and grants only authenticated execution", () => {
    const sql = readMigration();

    expect(sql).toContain("p_current_token_hash !~ '^[a-f0-9]{64}$'");
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain(
      "revoke all on function public.list_current_user_application_sessions(text) from public, anon, authenticated",
    );
    expect(sql).toContain(
      "grant execute on function public.list_current_user_application_sessions(text) to authenticated",
    );
  });
});
