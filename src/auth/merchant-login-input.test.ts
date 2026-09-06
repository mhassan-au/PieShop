import { describe, expect, it } from "vitest";
import { parseMerchantLoginEmail } from "./merchant-login-input";

describe("merchant login input", () => {
  it("normalizes a bounded email and rejects malformed input", () => {
    expect(parseMerchantLoginEmail(" Merchant@Example.com ")).toBe(
      "merchant@example.com",
    );
    expect(parseMerchantLoginEmail("not-an-email")).toBeNull();
    expect(parseMerchantLoginEmail(null)).toBeNull();
  });
});
