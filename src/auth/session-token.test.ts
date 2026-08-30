import { describe, expect, it } from "vitest";

import {
  createOpaqueSessionCredential,
  hashSessionToken,
  parseSessionToken,
} from "./session-token";

describe("opaque application session credentials", () => {
  it("creates a 256-bit base64url token and stores only its hash", async () => {
    const credential = await createOpaqueSessionCredential(() =>
      Uint8Array.from({ length: 32 }, (_, index) => index),
    );

    expect(credential.token).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(credential.tokenHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(credential.tokenHash).not.toContain(credential.token);
    await expect(hashSessionToken(credential.token)).resolves.toBe(
      credential.tokenHash,
    );
  });

  it("creates different credentials from different entropy", async () => {
    const first = await createOpaqueSessionCredential(() =>
      Uint8Array.from({ length: 32 }, () => 1),
    );
    const second = await createOpaqueSessionCredential(() =>
      Uint8Array.from({ length: 32 }, () => 2),
    );

    expect(first.token).not.toBe(second.token);
    expect(first.tokenHash).not.toBe(second.tokenHash);
  });

  it.each([
    undefined,
    null,
    "",
    "short",
    "a".repeat(42),
    "a".repeat(44),
    `${"a".repeat(42)}+`,
  ])("rejects malformed cookie token %s before hashing", async (token) => {
    expect(parseSessionToken(token)).toBeNull();
    await expect(hashSessionToken(token)).resolves.toBeNull();
  });
});
