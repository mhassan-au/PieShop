import { describe, expect, it, vi } from "vitest";
import {
  clearMerchantSessionCookie,
  MERCHANT_SESSION_MAX_AGE_SECONDS,
  readMerchantSessionCookie,
  setMerchantSessionCookie,
} from "./merchant-session-cookie";

const token = "a".repeat(43);

describe("merchant session cookie", () => {
  it("uses a hardened secure host cookie outside local development", () => {
    const set = vi.fn();
    setMerchantSessionCookie({ get: vi.fn(), set }, token, "production");
    expect(set).toHaveBeenCalledWith(
      "__Host-pieshop_merchant_session",
      token,
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      }),
    );
    expect(MERCHANT_SESSION_MAX_AGE_SECONDS).toBe(30 * 24 * 60 * 60);
  });

  it("reads only well-formed local credentials", () => {
    expect(
      readMerchantSessionCookie({ get: () => ({ value: token }) }, "local"),
    ).toBe(token);
    expect(
      readMerchantSessionCookie({ get: () => ({ value: "invalid" }) }, "local"),
    ).toBeNull();
  });

  it("clears the exact environment cookie", () => {
    const set = vi.fn();
    clearMerchantSessionCookie({ get: vi.fn(), set }, "production");
    expect(set).toHaveBeenCalledWith(
      "__Host-pieshop_merchant_session",
      "",
      expect.objectContaining({ maxAge: 0, secure: true }),
    );
  });
});
