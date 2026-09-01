import { describe, expect, it, vi } from "vitest";

import { verifyPlatformOwnerAccess } from "./owner-access-service";
import { INTERNAL_OWNER_ASSURANCE_POLICY } from "./platform-owner-policy";

const VALID_TOKEN = "A".repeat(43);

function createDependencies() {
  const getCurrentIdentity = vi.fn().mockResolvedValue({
    status: "authenticated" as const,
    identity: {
      id: "auth-user-1",
      email: "owner@example.test",
      assuranceLevel: "aal1" as const,
    },
  });
  const getCurrentPlatformOwnerRole = vi
    .fn()
    .mockResolvedValue("active" as const);
  const touch = vi.fn().mockResolvedValue(true);
  const record = vi.fn().mockResolvedValue(undefined);

  return {
    identityProvider: { getCurrentIdentity },
    roleRepository: { getCurrentPlatformOwnerRole },
    sessionRepository: { touch },
    assurancePolicy: INTERNAL_OWNER_ASSURANCE_POLICY,
    securityAudit: { record },
    spies: { getCurrentIdentity, getCurrentPlatformOwnerRole, touch, record },
  };
}

describe("verifyPlatformOwnerAccess", () => {
  it("authorizes only after fresh identity, role, and application-session checks", async () => {
    const dependencies = createDependencies();

    await expect(
      verifyPlatformOwnerAccess(VALID_TOKEN, dependencies),
    ).resolves.toEqual({
      status: "authorized",
      principal: {
        id: "auth-user-1",
        email: "owner@example.test",
        assuranceLevel: "aal1",
      },
    });
    expect(dependencies.spies.touch).toHaveBeenCalledWith(
      "0f007385b6f9d4b7eeb2748605afe1a984a0a3bfa3f014d09e2a784ce9e5cd1a",
    );
  });

  it.each([null, "malformed"])(
    "denies a missing or malformed cookie without external calls",
    async (token) => {
      const dependencies = createDependencies();

      await expect(
        verifyPlatformOwnerAccess(token, dependencies),
      ).resolves.toEqual({ status: "denied", reason: "session_required" });
      expect(dependencies.spies.getCurrentIdentity).not.toHaveBeenCalled();
      expect(
        dependencies.spies.getCurrentPlatformOwnerRole,
      ).not.toHaveBeenCalled();
      expect(dependencies.spies.touch).not.toHaveBeenCalled();
      expect(dependencies.spies.record).toHaveBeenCalledWith(
        "auth.session.denied",
        { outcome: "session_required" },
      );
    },
  );

  it("denies immediately when the provider user is no longer authenticated", async () => {
    const dependencies = createDependencies();
    dependencies.spies.getCurrentIdentity.mockResolvedValue({
      status: "unauthenticated",
    });

    await expect(
      verifyPlatformOwnerAccess(VALID_TOKEN, dependencies),
    ).resolves.toEqual({ status: "denied", reason: "authentication_required" });
    expect(
      dependencies.spies.getCurrentPlatformOwnerRole,
    ).not.toHaveBeenCalled();
    expect(dependencies.spies.touch).not.toHaveBeenCalled();
    expect(dependencies.spies.record).toHaveBeenCalledWith(
      "auth.session.denied",
      { outcome: "authentication_required" },
    );
  });

  it("denies a stale active browser session after the database role is removed", async () => {
    const dependencies = createDependencies();
    dependencies.spies.getCurrentPlatformOwnerRole.mockResolvedValue(
      "inactive",
    );

    await expect(
      verifyPlatformOwnerAccess(VALID_TOKEN, dependencies),
    ).resolves.toEqual({ status: "denied", reason: "role_required" });
    expect(dependencies.spies.touch).not.toHaveBeenCalled();
    expect(dependencies.spies.record).toHaveBeenCalledWith(
      "auth.authorization.denied",
      { outcome: "role_required", actorId: "auth-user-1" },
    );
  });

  it("denies a revoked or expired application session", async () => {
    const dependencies = createDependencies();
    dependencies.spies.touch.mockResolvedValue(false);

    await expect(
      verifyPlatformOwnerAccess(VALID_TOKEN, dependencies),
    ).resolves.toEqual({ status: "denied", reason: "session_invalid" });
    expect(dependencies.spies.record).toHaveBeenCalledWith(
      "auth.session.denied",
      { outcome: "session_invalid", actorId: "auth-user-1" },
    );
  });

  it("does not let audit failure change an authorization denial", async () => {
    const dependencies = createDependencies();
    dependencies.spies.touch.mockResolvedValue(false);
    dependencies.spies.record.mockRejectedValue(new Error("sink unavailable"));

    await expect(
      verifyPlatformOwnerAccess(VALID_TOKEN, dependencies),
    ).resolves.toEqual({ status: "denied", reason: "session_invalid" });
  });
});
