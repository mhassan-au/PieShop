import { describe, expect, it, vi } from "vitest";

import { logoutPlatformOwner } from "./owner-logout-service";

const sessionToken = "A".repeat(43);

function createDependencies() {
  const revokeCurrentByTokenHash = vi.fn().mockResolvedValue(true);
  const terminateSession = vi.fn().mockResolvedValue(undefined);
  return {
    sessionRepository: { revokeCurrentByTokenHash },
    authProvider: { terminateSession },
    spies: { revokeCurrentByTokenHash, terminateSession },
  };
}

describe("logoutPlatformOwner", () => {
  it("revokes the exact hashed application session and terminates provider auth", async () => {
    const dependencies = createDependencies();

    await expect(
      logoutPlatformOwner(sessionToken, dependencies),
    ).resolves.toEqual({ status: "signed_out" });
    expect(dependencies.spies.revokeCurrentByTokenHash).toHaveBeenCalledOnce();
    expect(
      dependencies.spies.revokeCurrentByTokenHash.mock.calls[0]?.[0],
    ).toMatch(/^[a-f0-9]{64}$/u);
    expect(
      dependencies.spies.revokeCurrentByTokenHash.mock.calls[0]?.[0],
    ).not.toBe(sessionToken);
    expect(dependencies.spies.terminateSession).toHaveBeenCalledOnce();
  });

  it("still terminates provider auth when the application cookie is absent", async () => {
    const dependencies = createDependencies();

    await expect(logoutPlatformOwner(null, dependencies)).resolves.toEqual({
      status: "signed_out",
    });
    expect(dependencies.spies.revokeCurrentByTokenHash).not.toHaveBeenCalled();
    expect(dependencies.spies.terminateSession).toHaveBeenCalledOnce();
  });

  it("attempts both boundaries and fails closed when either operation fails", async () => {
    const dependencies = createDependencies();
    dependencies.spies.revokeCurrentByTokenHash.mockRejectedValue(
      new Error("database secret"),
    );
    dependencies.spies.terminateSession.mockRejectedValue(
      new Error("provider secret"),
    );

    await expect(
      logoutPlatformOwner(sessionToken, dependencies),
    ).resolves.toEqual({ status: "unavailable" });
    expect(dependencies.spies.revokeCurrentByTokenHash).toHaveBeenCalledOnce();
    expect(dependencies.spies.terminateSession).toHaveBeenCalledOnce();
  });
});
