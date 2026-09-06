import { describe, expect, it, vi } from "vitest";
import { readInvitationAuthTarget } from "./invitation-auth-target";

describe("invitation authentication target", () => {
  it("requests only the recipient bound to the hash", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ recipient_email: "merchant@example.test" }],
      error: null,
    });
    await expect(
      readInvitationAuthTarget({ rpc } as never, "a".repeat(64)),
    ).resolves.toBe("merchant@example.test");
    expect(rpc).toHaveBeenCalledWith("get_server_invitation_auth_target", {
      p_token_hash_hex: "a".repeat(64),
    });
  });

  it("redacts provider failures", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "secret email" } });
    await expect(
      readInvitationAuthTarget({ rpc } as never, "a".repeat(64)),
    ).rejects.toThrow("Invitation authentication unavailable");
  });
});
