import { describe, expect, it, vi } from "vitest";

import { SupabaseCurrentOwnerProvider } from "./supabase-current-owner-provider";

function createClient(options?: {
  user?: { id: string; email: string } | null;
  userError?: { status?: number } | null;
  assurance?: "aal1" | "aal2" | null;
  assuranceError?: unknown;
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options?.user ?? null },
        error: options?.userError ?? null,
      }),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
          data: { currentLevel: options?.assurance ?? null },
          error: options?.assuranceError ?? null,
        }),
      },
    },
  };
}

describe("SupabaseCurrentOwnerProvider", () => {
  it("returns a provider-verified identity and current assurance level", async () => {
    const provider = new SupabaseCurrentOwnerProvider(
      createClient({
        user: { id: "auth-user-1", email: "owner@example.test" },
        assurance: "aal1",
      }),
    );

    await expect(provider.getCurrentIdentity()).resolves.toEqual({
      status: "authenticated",
      identity: {
        id: "auth-user-1",
        email: "owner@example.test",
        assuranceLevel: "aal1",
      },
    });
  });

  it("maps an absent or rejected provider user to unauthenticated", async () => {
    const provider = new SupabaseCurrentOwnerProvider(
      createClient({ userError: { status: 401 } }),
    );

    await expect(provider.getCurrentIdentity()).resolves.toEqual({
      status: "unauthenticated",
    });
  });

  it("fails closed when assurance cannot be established", async () => {
    const provider = new SupabaseCurrentOwnerProvider(
      createClient({
        user: { id: "auth-user-1", email: "owner@example.test" },
        assuranceError: { message: "provider secret" },
      }),
    );

    const result = await provider.getCurrentIdentity();
    expect(result).toEqual({ status: "unavailable" });
    expect(JSON.stringify(result)).not.toContain("provider secret");
  });
});
