import { describe, expect, it, vi } from "vitest";
import { SupabaseMerchantSessionRepository } from "./supabase-merchant-session-repository";

describe("SupabaseMerchantSessionRepository", () => {
  it("verifies through the self-bound RPC and maps only safe authority", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          business_id: "11111111-1111-4111-8111-111111111111",
          membership_role: "merchant_owner",
          absolute_expires_at: "2026-10-05T00:00:00.000Z",
        },
      ],
      error: null,
    });
    const repository = new SupabaseMerchantSessionRepository({ rpc });
    await expect(repository.verify("a".repeat(64))).resolves.toEqual({
      businessId: "11111111-1111-4111-8111-111111111111",
      role: "merchant_owner",
      absoluteExpiresAt: "2026-10-05T00:00:00.000Z",
    });
    expect(rpc).toHaveBeenCalledWith("verify_current_merchant_session", {
      p_session_token_hash: "a".repeat(64),
    });
  });

  it("fails closed without provider details", async () => {
    const repository = new SupabaseMerchantSessionRepository({
      rpc: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "secret" } }),
    });
    await expect(repository.verify("a".repeat(64))).rejects.toThrow(
      "Merchant session operation failed",
    );
    await expect(repository.verify("a".repeat(64))).rejects.not.toThrow(
      "secret",
    );
  });
});
