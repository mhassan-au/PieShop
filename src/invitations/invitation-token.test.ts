import { describe, expect, it } from "vitest";

import {
  createInvitationToken,
  hashInvitationToken,
  invitationExpiry,
  isInvitationExpired,
} from "./invitation-token";

describe("invitation token", () => {
  it("creates URL-safe tokens with at least 256 bits of entropy", () => {
    const first = createInvitationToken();
    const second = createInvitationToken();
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(second).not.toBe(first);
  });

  it("stores a deterministic hash rather than the raw token", () => {
    const token = createInvitationToken();
    const hash = hashInvitationToken(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/u);
    expect(hash).not.toContain(token);
    expect(hashInvitationToken(token)).toBe(hash);
  });

  it("uses a 24-hour UTC expiry and an inclusive expiry boundary", () => {
    const issuedAt = new Date("2026-09-05T00:00:00.000Z");
    const expiresAt = invitationExpiry(issuedAt);
    expect(expiresAt.toISOString()).toBe("2026-09-06T00:00:00.000Z");
    expect(
      isInvitationExpired(expiresAt, new Date("2026-09-05T23:59:59.999Z")),
    ).toBe(false);
    expect(
      isInvitationExpired(expiresAt, new Date("2026-09-06T00:00:00.000Z")),
    ).toBe(true);
  });

  it("rejects malformed token material before hashing", () => {
    for (const value of ["", "short", "a".repeat(44), "!".repeat(43)]) {
      expect(() => hashInvitationToken(value)).toThrow();
    }
  });
});
