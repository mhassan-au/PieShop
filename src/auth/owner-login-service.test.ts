import { describe, expect, it, vi } from "vitest";

import { loginPlatformOwner } from "./owner-login-service";
import type { OwnerAuthProvider } from "./owner-auth-provider";
import { INTERNAL_OWNER_ASSURANCE_POLICY } from "./platform-owner-policy";

const validInput = {
  email: "owner@example.test",
  password: "password-secret",
};

function createDependencies() {
  const authenticate = vi
    .fn<OwnerAuthProvider["authenticate"]>()
    .mockResolvedValue({
      status: "authenticated",
      identity: {
        id: "auth-user-1",
        email: "owner@example.test",
        assuranceLevel: "aal1",
      },
    });
  const terminateSession = vi.fn().mockResolvedValue(undefined);
  const getCurrentPlatformOwnerRole = vi
    .fn()
    .mockResolvedValue("active" as const);
  const create = vi.fn().mockResolvedValue("application-session-1");
  const createCredential = vi.fn().mockResolvedValue({
    token: "A".repeat(43),
    tokenHash: "a".repeat(64),
  });
  const consume = vi.fn().mockResolvedValue({ status: "allowed" as const });
  const resetAccount = vi.fn().mockResolvedValue(undefined);
  const record = vi.fn().mockResolvedValue(undefined);

  return {
    authProvider: { authenticate, terminateSession },
    roleRepository: { getCurrentPlatformOwnerRole },
    sessionRepository: { create },
    assurancePolicy: INTERNAL_OWNER_ASSURANCE_POLICY,
    rateLimiter: { consume, resetAccount },
    clock: () => 1_000,
    securityAudit: { record },
    createCredential,
    spies: {
      authenticate,
      terminateSession,
      getCurrentPlatformOwnerRole,
      create,
      createCredential,
      consume,
      resetAccount,
      record,
    },
  };
}

describe("loginPlatformOwner", () => {
  it("authenticates, authorizes, and persists only the credential hash", async () => {
    const dependencies = createDependencies();

    await expect(
      loginPlatformOwner(
        validInput,
        "Firefox on Windows",
        "source-a",
        dependencies,
      ),
    ).resolves.toEqual({
      status: "authenticated",
      sessionId: "application-session-1",
      sessionToken: "A".repeat(43),
    });
    expect(dependencies.spies.create).toHaveBeenCalledWith(
      "a".repeat(64),
      "Firefox on Windows",
    );
    expect(dependencies.spies.terminateSession).not.toHaveBeenCalled();
    expect(dependencies.spies.consume).toHaveBeenCalledWith(
      "owner@example.test",
      "source-a",
      1_000,
    );
    expect(dependencies.spies.resetAccount).toHaveBeenCalledWith(
      "owner@example.test",
    );
    expect(dependencies.spies.record).toHaveBeenCalledWith(
      "auth.login.succeeded",
      { outcome: "authenticated", actorId: "auth-user-1" },
    );
  });

  it("returns a generic rejection without checking authorization", async () => {
    const dependencies = createDependencies();
    dependencies.spies.authenticate.mockResolvedValue({ status: "rejected" });

    await expect(
      loginPlatformOwner(validInput, null, "source-a", dependencies),
    ).resolves.toEqual({ status: "rejected" });
    expect(
      dependencies.spies.getCurrentPlatformOwnerRole,
    ).not.toHaveBeenCalled();
    expect(dependencies.spies.create).not.toHaveBeenCalled();
    expect(dependencies.spies.record).toHaveBeenCalledWith(
      "auth.login.failed",
      { outcome: "rejected" },
    );
  });

  it.each(["missing", "inactive"] as const)(
    "terminates the provisional provider session when the owner role is %s",
    async (role) => {
      const dependencies = createDependencies();
      dependencies.spies.getCurrentPlatformOwnerRole.mockResolvedValue(role);

      await expect(
        loginPlatformOwner(validInput, null, "source-a", dependencies),
      ).resolves.toEqual({ status: "rejected" });
      expect(dependencies.spies.terminateSession).toHaveBeenCalledOnce();
      expect(dependencies.spies.createCredential).not.toHaveBeenCalled();
      expect(dependencies.spies.record).toHaveBeenCalledWith(
        "auth.authorization.denied",
        { outcome: "rejected", actorId: "auth-user-1" },
      );
    },
  );

  it("terminates the provider session and fails closed when persistence fails", async () => {
    const dependencies = createDependencies();
    dependencies.spies.create.mockRejectedValue(new Error("database secret"));

    await expect(
      loginPlatformOwner(validInput, null, "source-a", dependencies),
    ).resolves.toEqual({ status: "unavailable" });
    expect(dependencies.spies.terminateSession).toHaveBeenCalledOnce();
    expect(
      JSON.stringify(
        await loginPlatformOwner(validInput, null, "source-a", dependencies),
      ),
    ).not.toContain("database secret");
  });

  it("does not call the provider when the account or source is throttled", async () => {
    const dependencies = createDependencies();
    dependencies.spies.consume.mockResolvedValue({ status: "throttled" });

    await expect(
      loginPlatformOwner(validInput, null, "source-a", dependencies),
    ).resolves.toEqual({ status: "throttled" });
    expect(dependencies.spies.authenticate).not.toHaveBeenCalled();
    expect(dependencies.spies.resetAccount).not.toHaveBeenCalled();
    expect(dependencies.spies.record).toHaveBeenCalledWith(
      "auth.login.throttled",
      { outcome: "throttled" },
    );
  });

  it("does not let audit sink failure change the authentication result", async () => {
    const dependencies = createDependencies();
    dependencies.spies.record.mockRejectedValue(new Error("sink unavailable"));

    await expect(
      loginPlatformOwner(validInput, null, "source-a", dependencies),
    ).resolves.toEqual({
      status: "authenticated",
      sessionId: "application-session-1",
      sessionToken: "A".repeat(43),
    });
  });
});
