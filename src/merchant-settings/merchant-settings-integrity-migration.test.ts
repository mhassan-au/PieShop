import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sql = fs
  .readFileSync(
    path.resolve(
      process.cwd(),
      "supabase/migrations/20261008020000_harden_merchant_settings_integrity.sql",
    ),
    "utf8",
  )
  .toLowerCase();

describe("SH-4 merchant settings integrity migration", () => {
  it("enforces exactly one eligible owner membership and the exact session", () => {
    expect(sql).toContain("eligible_owner_count <> 1");
    expect(sql).toContain("eligible_business_id <> candidate_business_id");
    expect(sql).toContain("s.token_hash = p_session_token_hash");
    expect(sql).toContain("s.revoked_at is null");
    expect(sql).toContain("s.absolute_expires_at > mutation_time");
  });

  it("validates required nulls before normalizing", () => {
    for (const parameter of [
      "p_business_name",
      "p_contact_email",
      "p_contact_phone",
      "p_currency_code",
      "p_timezone",
      "p_expected_version",
      "p_session_token_hash",
    ]) {
      expect(sql).toContain(`${parameter} is null`);
    }
  });

  it("locks and rechecks in business, session, settings order", () => {
    const businessLock = sql.indexOf("stage: lock business");
    const authorityRecheck = sql.indexOf("stage: recheck authority");
    const sessionLock = sql.indexOf("stage: lock exact session");
    const settingsLock = sql.indexOf("stage: lock settings");
    expect(businessLock).toBeGreaterThan(0);
    expect(authorityRecheck).toBeGreaterThan(businessLock);
    expect(sessionLock).toBeGreaterThan(authorityRecheck);
    expect(settingsLock).toBeGreaterThan(sessionLock);
  });

  it("returns a strict acknowledgement and stable conflict classification", () => {
    expect(sql).toContain(
      "returns table (business_id uuid, version integer, updated_at timestamptz)",
    );
    expect(sql).toContain("errcode = '40001'");
    expect(sql).toContain("settings_unavailable");
    expect(sql).toMatch(/jsonb_build_object\(\s*'changed_fields'/u);
  });
});
