import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20261004010000_fresh_session_creation_and_legacy_access.sql",
);

function readMigration(): string {
  return readFileSync(migrationPath, "utf8").toLowerCase();
}

describe("fresh session creation and legacy access migration", () => {
  it("derives recent provider authentication evidence from signed JWT claims", () => {
    const sql = readMigration();

    expect(sql).toContain("auth.jwt()");
    expect(sql).toContain("session_id");
    expect(sql).toContain("jsonb_array_elements");
    expect(sql).toContain("'amr'");
    expect(sql).toContain("interval '5 minutes'");
    expect(sql).toContain("from auth.sessions");
    expect(sql).toContain("auth.uid()");
  });

  it("binds owner creation to recent password authentication", () => {
    const sql = readMigration();

    expect(sql).toContain(
      "function public.create_current_owner_session_from_password",
    );
    expect(sql).toContain("'password'");
    expect(sql).toContain("provider_session_id");
    expect(sql).toContain("authenticated_at");
    expect(sql).toContain("authentication_method");
    expect(sql).toContain("authenticated_at + interval '12 hours'");
  });

  it("binds both merchant paths to recent verified email-link authentication", () => {
    const sql = readMigration();

    expect(sql).toContain(
      "function public.start_current_merchant_session_from_magic_link",
    );
    expect(sql).toContain(
      "function public.redeem_merchant_invitation_from_magic_link",
    );
    expect(sql).toContain("authenticated_at + interval '30 days'");
  });

  it("makes retries idempotent only for the same provider session and hash", () => {
    const sql = readMigration();

    expect(sql.match(/pg_advisory_xact_lock/gu)).toHaveLength(3);
    expect(sql).toContain("hashtextextended");
    expect(sql).toContain("existing_token_hash = p_token_hash");
    expect(sql).toContain("existing_token_hash = p_session_token_hash");
    expect(sql).toContain(
      "provider_session_id = authentication.provider_session_id",
    );
    expect(sql).toContain("return existing_session_id");
  });

  it("retires caller-mintable session creation functions", () => {
    const sql = readMigration();

    expect(sql).toContain(
      "revoke all on function public.create_current_owner_session(text, text)",
    );
    expect(sql).toContain(
      "revoke all on function public.start_current_merchant_session(text)",
    );
    expect(sql).toContain(
      "revoke all on function public.redeem_merchant_invitation(text, text)",
    );
    expect(sql).not.toMatch(
      /grant execute on function public\.(?:create_current_owner_session|start_current_merchant_session|redeem_merchant_invitation)\(/u,
    );
  });

  it("removes obsolete direct catalogue and transaction access", () => {
    const sql = readMigration();

    expect(sql).toContain(
      "revoke select, insert, update on public.catalogue_entries from authenticated",
    );
    expect(sql).toContain(
      "revoke select, insert on public.transaction_records from authenticated",
    );
    for (const policy of [
      "catalogue_entries_select_member",
      "catalogue_entries_insert_member",
      "catalogue_entries_update_member",
      "transaction_records_select_member",
      "transaction_records_insert_member",
    ]) {
      expect(sql).toContain(`drop policy ${policy}`);
    }
  });

  it("keeps provider and credential identifiers out of audit context", () => {
    const sql = readMigration();

    expect(sql).not.toMatch(
      /jsonb_build_object\([^;]*(?:token_hash|provider_session_id|session_id)/u,
    );
  });
});
