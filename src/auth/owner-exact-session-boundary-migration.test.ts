import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20260906080000_owner_exact_session_rpc_boundaries.sql",
);

describe("owner exact-session RPC boundary migration", () => {
  const sql = readFileSync(migrationPath, "utf8").toLowerCase();

  it("defines a self-bound live owner-session helper", () => {
    expect(sql).toContain("app_private.is_current_owner_session");
    expect(sql).toContain("s.user_id = (select auth.uid())");
    expect(sql).toContain("s.token_hash = p_owner_session_token_hash");
    expect(sql).toContain("s.revoked_at is null");
    expect(sql).toContain("s.absolute_expires_at > statement_timestamp()");
    expect(sql).toContain("s.idle_expires_at > statement_timestamp()");
    expect(sql).not.toMatch(/is_current_owner_session\([^)]*user_id/u);
  });

  it("replaces every interactive owner RPC with a session-bound signature", () => {
    for (const signature of [
      "list_platform_merchants(text)",
      "create_platform_merchant(text, text, text, text, text)",
      "issue_platform_merchant_invitation(uuid, text, timestamptz, text)",
      "revoke_platform_merchant_invitation(uuid, text)",
      "change_platform_merchant_status(uuid, text, text)",
      "list_current_user_application_sessions(text)",
      "revoke_current_owner_session(uuid, text, text)",
      "revoke_all_current_user_sessions(text, text)",
    ]) {
      expect(sql).toContain(`function public.${signature}`);
    }
  });

  it("drops obsolete callable signatures and removes direct owner business reads", () => {
    for (const signature of [
      "list_platform_merchants()",
      "create_platform_merchant(text, text, text, text)",
      "issue_platform_merchant_invitation(uuid, text, timestamptz)",
      "revoke_platform_merchant_invitation(uuid)",
      "change_platform_merchant_status(uuid, text)",
      "revoke_current_owner_session(uuid, text)",
      "revoke_all_current_user_sessions(text)",
    ]) {
      expect(sql).toMatch(
        new RegExp(
          `(?:drop|alter) function public\\.${signature.replace(/[()]/gu, "\\$&")}`,
          "u",
        ),
      );
    }
    expect(sql).toContain("drop policy businesses_select_authorised");
    expect(sql).toContain("app_private.current_user_has_active_membership(id)");
    expect(sql).not.toMatch(
      /create policy businesses_select_authorised[\s\S]*is_current_user_active_platform_owner/u,
    );
  });

  it("does not expose hashes in rows or audits", () => {
    expect(sql).not.toMatch(/returns table[^$]*token_hash/u);
    expect(sql).not.toMatch(/jsonb_build_object\([^;]*token_hash/u);
  });
});
