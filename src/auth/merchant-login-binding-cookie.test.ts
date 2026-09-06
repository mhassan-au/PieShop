import { describe, expect, it, vi } from "vitest";

import {
  clearMerchantLoginBindingCookie,
  hashMerchantLoginIdentity,
  MERCHANT_LOGIN_BINDING_MAX_AGE_SECONDS,
  readMerchantLoginBindingCookie,
  setMerchantLoginBindingCookie,
} from "./merchant-login-binding-cookie";

describe("merchant login binding cookie", () => {
  it("normalizes and hashes the identity without storing the email", () => {
    expect(hashMerchantLoginIdentity(" Merchant@Example.com ")).toBe(
      hashMerchantLoginIdentity("merchant@example.com"),
    );
    expect(hashMerchantLoginIdentity("merchant@example.com")).toMatch(
      /^[a-f0-9]{64}$/u,
    );
  });

  it("uses a short-lived hardened cookie and clears the exact cookie", () => {
    const set = vi.fn();
    const hash = "a".repeat(64);
    setMerchantLoginBindingCookie({ get: vi.fn(), set }, hash, "production");
    expect(set).toHaveBeenCalledWith(
      "__Host-pieshop_merchant_login_binding",
      hash,
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 15 * 60,
      }),
    );
    expect(MERCHANT_LOGIN_BINDING_MAX_AGE_SECONDS).toBe(900);
    expect(
      readMerchantLoginBindingCookie({ get: () => ({ value: hash }) }, "local"),
    ).toBe(hash);
    clearMerchantLoginBindingCookie({ get: vi.fn(), set }, "production");
    expect(set).toHaveBeenLastCalledWith(
      "__Host-pieshop_merchant_login_binding",
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
  });
});
