import { describe, expect, it } from "vitest";

import {
  createOwnerSessionRecord,
  evaluateOwnerSession,
  OWNER_SESSION_ABSOLUTE_MILLISECONDS,
  OWNER_SESSION_IDLE_MILLISECONDS,
  recordOwnerSessionActivity,
} from "./application-session-policy";

const createdAt = "2026-08-30T00:00:00.000Z";

describe("owner application session policy", () => {
  it("creates exact UTC absolute and idle deadlines", () => {
    expect(
      createOwnerSessionRecord("session-1", "auth-user-1", createdAt),
    ).toEqual({
      id: "session-1",
      userId: "auth-user-1",
      createdAt,
      lastActivityAt: createdAt,
      absoluteExpiresAt: "2026-08-30T12:00:00.000Z",
      idleExpiresAt: "2026-08-30T02:00:00.000Z",
      revokedAt: null,
    });
  });

  it("is valid immediately before both expiry boundaries", () => {
    const session = createOwnerSessionRecord(
      "session-1",
      "auth-user-1",
      createdAt,
    );

    expect(evaluateOwnerSession(session, "2026-08-30T01:59:59.999Z")).toEqual({
      status: "valid",
    });
  });

  it("denies exactly at the idle boundary", () => {
    const session = createOwnerSessionRecord(
      "session-1",
      "auth-user-1",
      createdAt,
    );

    expect(evaluateOwnerSession(session, "2026-08-30T02:00:00.000Z")).toEqual({
      status: "denied",
      reason: "idle_expired",
    });
  });

  it("denies exactly at the absolute boundary even after recent activity", () => {
    const session = {
      ...createOwnerSessionRecord("session-1", "auth-user-1", createdAt),
      lastActivityAt: "2026-08-30T11:59:00.000Z",
      idleExpiresAt: "2026-08-30T13:59:00.000Z",
    };

    expect(evaluateOwnerSession(session, "2026-08-30T12:00:00.000Z")).toEqual({
      status: "denied",
      reason: "absolute_expired",
    });
  });

  it("activity updates idle expiry but never absolute expiry", () => {
    const session = createOwnerSessionRecord(
      "session-1",
      "auth-user-1",
      createdAt,
    );
    const updated = recordOwnerSessionActivity(
      session,
      "2026-08-30T01:30:00.000Z",
    );

    expect(updated.lastActivityAt).toBe("2026-08-30T01:30:00.000Z");
    expect(updated.idleExpiresAt).toBe("2026-08-30T03:30:00.000Z");
    expect(updated.absoluteExpiresAt).toBe("2026-08-30T12:00:00.000Z");
  });

  it("denies a revoked session before considering expiry", () => {
    const session = {
      ...createOwnerSessionRecord("session-1", "auth-user-1", createdAt),
      revokedAt: "2026-08-30T00:30:00.000Z",
    };

    expect(evaluateOwnerSession(session, "2026-08-30T00:31:00.000Z")).toEqual({
      status: "denied",
      reason: "revoked",
    });
  });

  it.each([
    { now: "invalid", field: "now" },
    { now: "2026-08-29T23:59:59.999Z", field: "now" },
  ])("fails closed for invalid chronology in $field", ({ now }) => {
    const session = createOwnerSessionRecord(
      "session-1",
      "auth-user-1",
      createdAt,
    );

    expect(evaluateOwnerSession(session, now)).toEqual({
      status: "denied",
      reason: "invalid",
    });
  });

  it("uses the accepted 12-hour and 2-hour durations", () => {
    expect(OWNER_SESSION_ABSOLUTE_MILLISECONDS).toBe(12 * 60 * 60 * 1000);
    expect(OWNER_SESSION_IDLE_MILLISECONDS).toBe(2 * 60 * 60 * 1000);
  });
});
