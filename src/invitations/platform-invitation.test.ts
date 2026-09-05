import { describe, expect, it, vi } from "vitest";

import { parseEnvironment } from "@/config/env";
import { createDevelopmentInvitationPreview } from "./development-invitation-delivery";
import { parseInvitationTarget } from "./platform-invitation";
import { SupabasePlatformInvitationRepository } from "./supabase-platform-invitation-repository";

const businessId = "11111111-1111-4111-8111-111111111111";

describe("platform invitation boundary", () => {
  it("accepts only an exact business identifier", () => {
    expect(parseInvitationTarget({ businessId })).toEqual({ businessId });
    expect(() =>
      parseInvitationTarget({ businessId, email: "hidden@example.test" }),
    ).toThrow();
  });

  it("maps only safe issue and revoke RPC parameters", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{}], error: null });
    const repository = new SupabasePlatformInvitationRepository({ rpc });
    await repository.issue({
      businessId,
      tokenHash: "a".repeat(64),
      expiresAt: "2026-09-06T00:00:00.000Z",
    });
    await repository.revoke({ businessId });
    expect(rpc).toHaveBeenNthCalledWith(
      1,
      "issue_platform_merchant_invitation",
      {
        p_business_id: businessId,
        p_expires_at: "2026-09-06T00:00:00.000Z",
        p_token_hash_hex: "a".repeat(64),
      },
    );
    expect(rpc).toHaveBeenNthCalledWith(
      2,
      "revoke_platform_merchant_invitation",
      { p_business_id: businessId },
    );
  });

  it("redacts provider failures", async () => {
    const repository = new SupabasePlatformInvitationRepository({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "secret recipient" },
      }),
    });
    await expect(repository.revoke({ businessId })).rejects.toThrow(
      "Invitation operation failed",
    );
    await expect(repository.revoke({ businessId })).rejects.not.toThrow(
      "secret recipient",
    );
  });

  it("validates public inspection rows and returns null for unavailable links", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: [
          {
            business_name: "Example Pies",
            invitation_status: "issued",
            expires_at: "2026-09-06T00:00:00.000Z",
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: [], error: null });
    const repository = new SupabasePlatformInvitationRepository({ rpc });
    await expect(repository.inspect("a".repeat(64))).resolves.toEqual({
      businessName: "Example Pies",
      expiresAt: "2026-09-06T00:00:00.000Z",
    });
    await expect(repository.inspect("b".repeat(64))).resolves.toBeNull();
  });

  it("redeems with hashes only and maps safe membership authority", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ business_id: businessId, membership_role: "merchant_owner" }],
      error: null,
    });
    const repository = new SupabasePlatformInvitationRepository({ rpc });
    await expect(
      repository.redeem("a".repeat(64), "b".repeat(64)),
    ).resolves.toEqual({
      businessId,
      role: "merchant_owner",
    });
    expect(rpc).toHaveBeenCalledWith("redeem_merchant_invitation", {
      p_session_token_hash: "b".repeat(64),
      p_token_hash_hex: "a".repeat(64),
    });
  });

  it("allows previews only in synthetic local or test environments", () => {
    const local = parseEnvironment({
      APP_ENV: "local",
      APP_BASE_URL: "http://localhost:3000",
    });
    expect(createDevelopmentInvitationPreview(local, "a".repeat(43))).toBe(
      `http://localhost:3000/invite/${"a".repeat(43)}`,
    );
    const production = parseEnvironment({
      APP_ENV: "production",
      APP_BASE_URL: "https://example.test",
    });
    expect(() =>
      createDevelopmentInvitationPreview(production, "a".repeat(43)),
    ).toThrow("unavailable");
  });
});
