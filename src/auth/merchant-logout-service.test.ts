import { describe, expect, it, vi } from "vitest";
import { logoutMerchant } from "./merchant-logout-service";

describe("merchant logout", () => {
  it("revokes the exact hash and terminates provider auth", async () => {
    const revokeCurrentByTokenHash = vi.fn().mockResolvedValue(true);
    const terminateSession = vi.fn().mockResolvedValue(undefined);
    await expect(
      logoutMerchant("a".repeat(43), {
        sessionRepository: { revokeCurrentByTokenHash },
        authProvider: { terminateSession },
      }),
    ).resolves.toEqual({ status: "signed_out" });
    expect(revokeCurrentByTokenHash).toHaveBeenCalledWith(
      expect.stringMatching(/^[a-f0-9]{64}$/u),
    );
    expect(terminateSession).toHaveBeenCalledOnce();
  });

  it("attempts both boundaries when revocation fails", async () => {
    const revokeCurrentByTokenHash = vi
      .fn()
      .mockRejectedValue(new Error("secret"));
    const terminateSession = vi.fn().mockResolvedValue(undefined);
    await expect(
      logoutMerchant("a".repeat(43), {
        sessionRepository: { revokeCurrentByTokenHash },
        authProvider: { terminateSession },
      }),
    ).resolves.toEqual({ status: "unavailable" });
    expect(terminateSession).toHaveBeenCalledOnce();
  });
});
