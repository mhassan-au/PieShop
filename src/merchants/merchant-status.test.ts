import { describe, expect, it } from "vitest";
import {
  onboardingProgressFor,
  parseMerchantStatusChange,
} from "./merchant-status";

describe("merchant status", () => {
  it("accepts only a UUID and known target status", () => {
    expect(
      parseMerchantStatusChange({
        businessId: "11111111-1111-4111-8111-111111111111",
        targetStatus: "suspended",
      }),
    ).toEqual({
      businessId: "11111111-1111-4111-8111-111111111111",
      targetStatus: "suspended",
    });
    expect(() =>
      parseMerchantStatusChange({ businessId: "bad", targetStatus: "active" }),
    ).toThrow();
    expect(() =>
      parseMerchantStatusChange({
        businessId: "11111111-1111-4111-8111-111111111111",
        targetStatus: "deleted",
      }),
    ).toThrow();
  });

  it("derives progress from allow-listed account metadata", () => {
    expect(onboardingProgressFor("onboarding", "draft")).toBe(
      "invitation_pending",
    );
    expect(onboardingProgressFor("onboarding", "used")).toBe(
      "ready_to_activate",
    );
    expect(onboardingProgressFor("active", "used")).toBe("active");
    expect(onboardingProgressFor("suspended", "used")).toBe("suspended");
    expect(onboardingProgressFor("archived", "used")).toBe("archived");
  });
});
