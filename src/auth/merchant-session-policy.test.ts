import { describe, expect, it } from "vitest";

import {
  createMerchantSessionRecord,
  evaluateMerchantSession,
  MERCHANT_SESSION_ABSOLUTE_MILLISECONDS,
} from "./merchant-session-policy";

const createdAt = "2026-09-05T00:00:00.000Z";

describe("merchant session policy", () => {
  it("creates an exact 30-day UTC absolute deadline", () => {
    expect(
      createMerchantSessionRecord(
        "session-1",
        "user-1",
        "business-1",
        createdAt,
      ),
    ).toEqual({
      id: "session-1",
      userId: "user-1",
      businessId: "business-1",
      createdAt,
      absoluteExpiresAt: "2026-10-05T00:00:00.000Z",
      revokedAt: null,
    });
  });

  it("allows immediately before but denies exactly at expiry", () => {
    const session = createMerchantSessionRecord(
      "session-1",
      "user-1",
      "business-1",
      createdAt,
    );
    expect(
      evaluateMerchantSession(session, "2026-10-04T23:59:59.999Z"),
    ).toEqual({ status: "valid" });
    expect(
      evaluateMerchantSession(session, "2026-10-05T00:00:00.000Z"),
    ).toEqual({ status: "denied", reason: "absolute_expired" });
  });

  it("denies revoked sessions and invalid chronology", () => {
    const session = createMerchantSessionRecord(
      "session-1",
      "user-1",
      "business-1",
      createdAt,
    );
    expect(
      evaluateMerchantSession(
        { ...session, revokedAt: "2026-09-06T00:00:00.000Z" },
        "2026-09-07T00:00:00.000Z",
      ),
    ).toEqual({ status: "denied", reason: "revoked" });
    expect(evaluateMerchantSession(session, "invalid")).toEqual({
      status: "denied",
      reason: "invalid",
    });
  });

  it("locks the accepted duration", () => {
    expect(MERCHANT_SESSION_ABSOLUTE_MILLISECONDS).toBe(
      30 * 24 * 60 * 60 * 1000,
    );
  });
});
