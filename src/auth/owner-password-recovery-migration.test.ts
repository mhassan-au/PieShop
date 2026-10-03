import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "supabase",
  "migrations",
  "20261003010000_owner_password_recovery.sql",
);

describe("owner password recovery migration", () => {
  it("self-binds recovery revocation and writes an actor-unclaimed audit", () => {
    const sql = fs.readFileSync(migrationPath, "utf8").toLowerCase();

    expect(sql).toContain(
      "function public.revoke_current_owner_sessions_for_recovery()",
    );
    expect(sql).toContain("current_user_id := (select auth.uid())");
    expect(sql).toContain("role = 'platform_owner'");
    expect(sql).toContain("revoked_reason = 'recovery'");
    expect(sql).toContain("'auth.recovery.sessions_revoked'");
    expect(sql).toContain("actor_user_id");
    expect(sql).toMatch(/actor_user_id[\s\S]*null/u);
    expect(sql).toMatch(
      /grant execute on function public\.revoke_current_owner_sessions_for_recovery\(\)\s+to authenticated/u,
    );
    expect(sql).not.toMatch(/p_user_id|p_email|p_token/u);
  });
});
