import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260906060000_merchant_setup_settings.sql",
  ),
  "utf8",
).toLowerCase();

describe("merchant setup settings migration", () => {
  it("keeps settings tenant-bound and inaccessible through direct table grants", () => {
    expect(sql).toContain("create table public.merchant_settings");
    expect(sql).toContain(
      "business_id uuid primary key references public.businesses(id) on delete restrict",
    );
    expect(sql).toContain("enable row level security");
    expect(sql).toContain(
      "revoke all on public.merchant_settings from public, anon, authenticated",
    );
    expect(sql).not.toMatch(
      /grant\s+(?:select|insert|update|delete).*merchant_settings/u,
    );
  });

  it("self-binds reads and owner-only updates to fresh merchant authority", () => {
    expect(sql).toContain(
      "app_private.current_merchant_owner_business_id(text)",
    );
    expect(sql).toContain("public.get_current_merchant_settings(text)");
    expect(sql).toContain("public.update_current_merchant_settings(");
    expect(sql).toContain("m.role = 'merchant_owner'");
    expect(sql).toContain("b.status in ('onboarding', 'active')");
    expect(sql).toContain("for update");
    expect(sql).toContain("p_expected_version");
    expect(sql).toContain("settings_conflict");
  });

  it("exposes narrow RPCs and writes value-free idempotent audit context", () => {
    expect(sql).toMatch(
      /grant execute on function public\.get_current_merchant_settings\(text\)\s+to authenticated/u,
    );
    expect(sql).toMatch(
      /grant execute on function public\.update_current_merchant_settings\(text, text, text, text, text, integer, text\)\s+to authenticated/u,
    );
    expect(sql).toContain("merchant_application_sessions");
    expect(sql).toContain("session_token_hash = p_session_token_hash");
    expect(sql).toContain("'merchant.settings_updated'");
    expect(sql).toContain("'changed_fields'");
    expect(sql).not.toContain("'contact_email'");
    expect(sql).not.toContain("'contact_phone'");
  });
});
