import { describe, expect, it, vi } from "vitest";
import { SupabaseMerchantSettingsRepository } from "./supabase-merchant-settings-repository";

const row = {
  business_id: "123e4567-e89b-12d3-a456-426614174000",
  business_name: "Harbour Pies",
  contact_email: "test@example.com",
  contact_phone: "+61412345678",
  currency_code: "AUD",
  timezone: "Australia/Sydney",
  version: 1,
  updated_at: "2026-09-06T00:00:00.000Z",
};

describe("Supabase merchant settings repository", () => {
  it("reads through the session-bound RPC and allow-lists output", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [row], error: null });
    const result = await new SupabaseMerchantSettingsRepository({ rpc }).get(
      "hash",
    );
    expect(rpc).toHaveBeenCalledWith("get_current_merchant_settings", {
      p_session_token_hash: "hash",
    });
    expect(result.businessName).toBe("Harbour Pies");
  });

  it("updates through explicit parameters without a business ID", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          business_id: row.business_id,
          version: 2,
          updated_at: row.updated_at,
        },
      ],
      error: null,
    });
    await new SupabaseMerchantSettingsRepository({ rpc }).update(
      {
        businessName: "Harbour Pies",
        contactEmail: "test@example.com",
        contactPhone: "+61412345678",
        currencyCode: "AUD",
        timezone: "Australia/Sydney",
        version: 1,
      },
      "hash",
    );
    expect(rpc).toHaveBeenCalledWith(
      "update_current_merchant_settings",
      expect.objectContaining({
        p_expected_version: 1,
        p_session_token_hash: "hash",
      }),
    );
    expect(rpc.mock.calls[0]?.[1]).not.toHaveProperty("business_id");
  });

  it("redacts provider failures", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "provider-secret" } });
    await expect(
      new SupabaseMerchantSettingsRepository({ rpc }).get("hash"),
    ).rejects.toThrow("Merchant settings operation failed");
  });
});
