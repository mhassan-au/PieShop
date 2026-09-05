import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/control/actions.ts"),
  "utf8",
);
const action = source.slice(
  source.indexOf("export async function issueMerchantInvitationAction"),
  source.indexOf("export async function revokeMerchantInvitationAction"),
);

describe("merchant invitation delivery action contract", () => {
  it("authorizes before target access, issuance, and delivery", () => {
    expect(action.indexOf("requireOwnerForInvitation()")).toBeLessThan(
      action.indexOf("readInvitationDeliveryTarget"),
    );
    expect(action.indexOf("readInvitationDeliveryTarget")).toBeLessThan(
      action.indexOf("repository.issue"),
    );
    expect(action.indexOf("repository.issue")).toBeLessThan(
      action.indexOf("createMailtrapInvitationDelivery"),
    );
  });

  it("revokes an issued token when delivery fails and returns no secret link", () => {
    expect(action).toContain("await repository.revoke(target)");
    expect(action).not.toMatch(/previewUrl\s*[,}]/u);
    expect(action).not.toContain("recipientEmail:");
  });
});
