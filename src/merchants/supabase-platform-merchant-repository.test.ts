import { describe, expect, it, vi } from "vitest";

import { SupabasePlatformMerchantRepository } from "./supabase-platform-merchant-repository";

const row = {
  id: "11111111-1111-4111-8111-111111111111",
  public_id: "biz_12345678",
  name: "Example Pies",
  status: "onboarding",
  timezone: "Australia/Sydney",
  currency_code: "AUD",
  invitation_status: "draft",
  created_at: "2026-09-01T00:00:00.000Z",
  updated_at: "2026-09-01T00:00:00.000Z",
};

describe("SupabasePlatformMerchantRepository", () => {
  it("lists only runtime-validated platform metadata", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [row], error: null });
    const repository = new SupabasePlatformMerchantRepository({ rpc });

    await expect(repository.list()).resolves.toEqual([
      expect.objectContaining({
        publicId: "biz_12345678",
        name: "Example Pies",
      }),
    ]);
    expect(rpc).toHaveBeenCalledWith("list_platform_merchants");
  });

  it("passes only normalized create parameters to the self-authorizing RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [row], error: null });
    const repository = new SupabasePlatformMerchantRepository({ rpc });

    await repository.create({
      name: "Example Pies",
      ownerEmail: "owner@example.test",
      timezone: "Australia/Sydney",
      currencyCode: "AUD",
    });

    expect(rpc).toHaveBeenCalledWith("create_platform_merchant", {
      p_currency_code: "AUD",
      p_name: "Example Pies",
      p_owner_email: "owner@example.test",
      p_timezone: "Australia/Sydney",
    });
  });

  it("fails closed for provider errors, malformed rows, or contradictory create results", async () => {
    const providerFailure = new SupabasePlatformMerchantRepository({
      rpc: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "email secret" } }),
    });
    await expect(providerFailure.list()).rejects.toThrow(
      "Merchant operation failed",
    );
    await expect(providerFailure.list()).rejects.not.toThrow("email secret");

    const forbiddenRow = new SupabasePlatformMerchantRepository({
      rpc: vi
        .fn()
        .mockResolvedValue({
          data: [{ ...row, catalogue: "hidden" }],
          error: null,
        }),
    });
    await expect(forbiddenRow.list()).rejects.toThrow(
      "Merchant operation failed",
    );

    const duplicateResult = new SupabasePlatformMerchantRepository({
      rpc: vi.fn().mockResolvedValue({ data: [row, row], error: null }),
    });
    await expect(
      duplicateResult.create({
        name: "Example Pies",
        ownerEmail: "owner@example.test",
        timezone: "Australia/Sydney",
        currencyCode: "AUD",
      }),
    ).rejects.toThrow("Merchant operation failed");
  });
});
