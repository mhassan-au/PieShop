import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  join(process.cwd(), "src/app/merchant/settings/route.ts"),
  "utf8",
);

describe("merchant settings POST route contract", () => {
  it("rejects cross-origin posts and delegates to the authorized update", () => {
    expect(route).toContain('request.headers.get("origin")');
    expect(route).toContain("request.nextUrl.origin");
    expect(route).toContain("updateMerchantSettingsAction");
    expect(route).toContain("request.formData()");
  });

  it("redirects with status only and never places submitted values in the URL", () => {
    expect(route).toContain('searchParams.set("settings"');
    expect(route).not.toContain('searchParams.set("businessName"');
    expect(route).not.toContain('searchParams.set("contactEmail"');
    expect(route).not.toContain('searchParams.set("contactPhone"');
    expect(route).toContain("status: 303");
  });
});
