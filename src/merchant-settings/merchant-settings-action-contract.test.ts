import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const action = readFileSync(
  join(process.cwd(), "src/app/merchant/actions.ts"),
  "utf8",
);

describe("merchant settings action contract", () => {
  it("re-authorizes, hashes the current app session, and allow-lists FormData", () => {
    expect(action).toContain("verifyRequestMerchantAccess");
    expect(action).toContain("readMerchantSessionCookie");
    expect(action).toContain("hashSessionToken");
    for (const field of [
      "businessName",
      "contactEmail",
      "contactPhone",
      "currencyCode",
      "timezone",
      "version",
    ])
      expect(action).toContain(`formData.get("${field}")`);
    expect(action).not.toContain('formData.get("businessId")');
  });

  it("uses central feedback and revalidates only the merchant page", () => {
    expect(action).toContain(
      'formatMessage("merchant.settings.update.success")',
    );
    expect(action).toContain('"merchant.settings.update.failure"');
    expect(action).toContain('"merchant.settings.update.conflict"');
    expect(action).toContain("MerchantSettingsConflictError");
    expect(action).toContain('revalidatePath("/merchant")');
  });
});
