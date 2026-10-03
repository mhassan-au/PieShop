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
const ownerSessionHash = "f".repeat(64);

describe("SupabasePlatformMerchantRepository", () => {
  it("lists only runtime-validated platform metadata", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [row], error: null });
    const repository = new SupabasePlatformMerchantRepository({ rpc });

    await expect(repository.list(ownerSessionHash)).resolves.toEqual([
      expect.objectContaining({
        publicId: "biz_12345678",
        name: "Example Pies",
      }),
    ]);
    expect(rpc).toHaveBeenCalledWith("list_platform_merchants", {
      p_owner_session_token_hash: ownerSessionHash,
    });
  });

  it("passes only normalized create parameters to the self-authorizing RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [row], error: null });
    const repository = new SupabasePlatformMerchantRepository({ rpc });

    await repository.create(
      {
        name: "Example Pies",
        ownerEmail: "owner@example.test",
        timezone: "Australia/Sydney",
        currencyCode: "AUD",
      },
      ownerSessionHash,
    );

    expect(rpc).toHaveBeenCalledWith("create_platform_merchant", {
      p_currency_code: "AUD",
      p_name: "Example Pies",
      p_owner_email: "owner@example.test",
      p_owner_session_token_hash: ownerSessionHash,
      p_timezone: "Australia/Sydney",
    });
  });

  it("changes status only through the self-authorizing RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    const repository = new SupabasePlatformMerchantRepository({ rpc });
    await repository.changeStatus(
      {
        businessId: "11111111-1111-4111-8111-111111111111",
        targetStatus: "suspended",
      },
      ownerSessionHash,
    );
    expect(rpc).toHaveBeenCalledWith("change_platform_merchant_status", {
      p_business_id: "11111111-1111-4111-8111-111111111111",
      p_owner_session_token_hash: ownerSessionHash,
      p_target_status: "suspended",
    });
  });

  it("fails closed for provider errors, malformed rows, or contradictory create results", async () => {
    const providerFailure = new SupabasePlatformMerchantRepository({
      rpc: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "email secret" } }),
    });
    await expect(providerFailure.list(ownerSessionHash)).rejects.toThrow(
      "Merchant operation failed",
    );
    await expect(providerFailure.list(ownerSessionHash)).rejects.not.toThrow(
      "email secret",
    );

    const forbiddenRow = new SupabasePlatformMerchantRepository({
      rpc: vi.fn().mockResolvedValue({
        data: [{ ...row, catalogue: "hidden" }],
        error: null,
      }),
    });
    await expect(forbiddenRow.list(ownerSessionHash)).rejects.toThrow(
      "Merchant operation failed",
    );

    const duplicateResult = new SupabasePlatformMerchantRepository({
      rpc: vi.fn().mockResolvedValue({ data: [row, row], error: null }),
    });
    await expect(
      duplicateResult.create(
        {
          name: "Example Pies",
          ownerEmail: "owner@example.test",
          timezone: "Australia/Sydney",
          currencyCode: "AUD",
        },
        ownerSessionHash,
      ),
    ).rejects.toThrow("Merchant operation failed");
  });
});
