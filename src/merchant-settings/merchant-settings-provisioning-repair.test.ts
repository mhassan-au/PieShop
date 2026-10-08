import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(
  process.cwd(),
  "supabase/migrations/20261008010000_provision_merchant_settings.sql",
);

describe("merchant settings provisioning repair", () => {
  it("backfills existing merchants and provisions settings for future merchants", () => {
    const sql = fs.readFileSync(migrationPath, "utf8").toLowerCase();

    expect(sql).toContain("insert into public.merchant_settings (business_id)");
    expect(sql).toContain("select id from public.businesses");
    expect(sql).toContain("on conflict (business_id) do nothing");
    expect(sql).toContain(
      "create function app_private.provision_merchant_settings()",
    );
    expect(sql).toContain("returns trigger");
    expect(sql).toContain("values (new.id)");
    expect(sql).toContain(
      "create trigger businesses_provision_merchant_settings",
    );
    expect(sql).toContain("after insert on public.businesses");
  });

  it("keeps the provisioning helper inaccessible to application roles", () => {
    const sql = fs.readFileSync(migrationPath, "utf8").toLowerCase();

    expect(sql).toMatch(
      /revoke all on function app_private\.provision_merchant_settings\(\)\s+from public, anon, authenticated/u,
    );
  });
});
