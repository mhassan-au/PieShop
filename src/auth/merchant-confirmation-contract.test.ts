import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const requestSource = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/invite/actions.ts"),
  "utf8",
);
const callbackSource = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/auth/confirm/route.ts"),
  "utf8",
);
const requestAction = requestSource.slice(
  requestSource.indexOf("export async function requestMerchantMagicLinkAction"),
);
const callback = callbackSource.slice(
  callbackSource.indexOf("export async function GET"),
);

describe("merchant confirmation contracts", () => {
  it("disables signup and binds the hash only after provider acceptance", () => {
    expect(requestAction).toContain("shouldCreateUser: false");
    expect(requestAction.indexOf("signInWithOtp")).toBeLessThan(
      requestAction.indexOf("setInvitationBindingCookie"),
    );
    expect(requestAction).not.toContain("recipientEmail:");
  });

  it("exchanges PKCE before atomic redemption and removes binding material", () => {
    expect(callback.indexOf("exchangeCodeForSession")).toBeLessThan(
      callback.indexOf(".redeem("),
    );
    expect(callback.indexOf(".redeem(")).toBeLessThan(
      callback.indexOf("setMerchantSessionCookie"),
    );
    expect(callback).toContain("clearInvitationBindingCookie");
    expect(callback).not.toMatch(/searchParams\.set\([^,]+,\s*invitationHash/u);
  });
});
