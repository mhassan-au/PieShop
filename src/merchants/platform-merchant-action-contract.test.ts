import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/control/actions.ts"),
  "utf8",
);

describe("create merchant Server Action contract", () => {
  it("authorizes before parsing or persistence and extracts only approved fields", () => {
    const action = source.slice(
      source.indexOf("export async function createMerchantAction"),
    );

    expect(action.indexOf("verifyRequestPlatformOwnerAccess()")).toBeLessThan(
      action.indexOf("parseCreateMerchantInput"),
    );
    expect(action.indexOf("parseCreateMerchantInput")).toBeLessThan(
      action.indexOf("repository.create"),
    );
    expect(action).toContain('formData.get("name")');
    expect(action).toContain('formData.get("ownerEmail")');
    expect(action).toContain('formData.get("timezone")');
    expect(action).toContain('formData.get("currencyCode")');
    expect(action).not.toMatch(/Object\.fromEntries|formData\.entries/u);
  });

  it("revalidates only the protected control page after success", () => {
    const action = source.slice(
      source.indexOf("export async function createMerchantAction"),
    );
    expect(action).toContain('revalidatePath("/control")');
  });
});
