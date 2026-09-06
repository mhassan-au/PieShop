import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const actionSource = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/merchant/login/actions.ts"),
  "utf8",
);
const callbackSource = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/auth/merchant-confirm/route.ts"),
  "utf8",
);
const action = actionSource.slice(
  actionSource.indexOf(
    "export async function requestReturningMerchantMagicLinkAction",
  ),
);
const callback = callbackSource.slice(
  callbackSource.indexOf("export async function GET"),
);

describe("returning merchant login contracts", () => {
  it("disables signup, checks eligibility, throttles, and returns generic copy", () => {
    expect(action).toContain("allowMerchantMagicLinkRequest");
    expect(action).toContain("isApprovedMerchantMagicLinkTarget");
    expect(action).toContain("shouldCreateUser: false");
    expect(action).toContain("genericSuccess()");
    expect(action.indexOf("signInWithOtp")).toBeLessThan(
      action.indexOf("setMerchantLoginBindingCookie"),
    );
  });

  it("exchanges PKCE and checks identity binding before creating a session", () => {
    expect(callback.indexOf("exchangeCodeForSession")).toBeLessThan(
      callback.indexOf("hashMerchantLoginIdentity(email) !== binding"),
    );
    expect(
      callback.indexOf("hashMerchantLoginIdentity(email) !== binding"),
    ).toBeLessThan(callback.indexOf(".startCurrent("));
    expect(callback.indexOf(".startCurrent(")).toBeLessThan(
      callback.indexOf("setMerchantSessionCookie"),
    );
    expect(callback).toContain("clearMerchantLoginBindingCookie");
  });
});
