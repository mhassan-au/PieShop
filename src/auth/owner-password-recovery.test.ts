import { describe, expect, it } from "vitest";

import {
  consumeOwnerRecoveryGrant,
  issueOwnerRecoveryGrant,
  parseOwnerRecoveryEmail,
  parseOwnerRecoveryPassword,
} from "./owner-password-recovery";

describe("owner password recovery input", () => {
  it("normalizes valid email without exposing account existence", () => {
    expect(parseOwnerRecoveryEmail(" Owner@Example.COM ")).toBe(
      "owner@example.com",
    );
    expect(parseOwnerRecoveryEmail("not-an-email")).toBeNull();
  });

  it("requires a matching strong password", () => {
    expect(parseOwnerRecoveryPassword("Abc!1234", "Abc!1234")).toBe("Abc!1234");
    expect(parseOwnerRecoveryPassword("Ab!1234", "Ab!1234")).toBeNull();
    expect(
      parseOwnerRecoveryPassword("Longer!Passphrase9", "different"),
    ).toBeNull();
  });

  it("issues a short-lived single-use grant", async () => {
    const now = 1_800_000_000_000;
    const grant = await issueOwnerRecoveryGrant("owner-id", now);

    await expect(
      consumeOwnerRecoveryGrant(grant, "owner-id", now + 1_000),
    ).resolves.toBe(true);
    await expect(
      consumeOwnerRecoveryGrant(grant, "owner-id", now + 2_000),
    ).resolves.toBe(false);
    const expired = await issueOwnerRecoveryGrant("owner-id", now);
    await expect(
      consumeOwnerRecoveryGrant(expired, "owner-id", now + 10 * 60_000 + 1),
    ).resolves.toBe(false);
  });
});
