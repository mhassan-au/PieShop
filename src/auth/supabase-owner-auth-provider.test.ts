import { describe, expect, it, vi } from "vitest";

import { SupabaseOwnerAuthProvider } from "./supabase-owner-auth-provider";

describe("SupabaseOwnerAuthProvider", () => {
  it("returns only the verified identity and discards provider session tokens", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: { id: "auth-user-1", email: "owner@example.test" },
        session: {
          access_token: "access-secret",
          refresh_token: "refresh-secret",
        },
      },
      error: null,
    });
    const provider = new SupabaseOwnerAuthProvider({
      auth: { signInWithPassword, signOut: vi.fn() },
    });

    const result = await provider.authenticate({
      email: "owner@example.test",
      password: "password-secret",
    });

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "owner@example.test",
      password: "password-secret",
    });
    expect(result).toEqual({
      status: "authenticated",
      identity: {
        id: "auth-user-1",
        email: "owner@example.test",
        assuranceLevel: "aal1",
      },
    });
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("maps credential rejection without exposing the provider message", async () => {
    const provider = new SupabaseOwnerAuthProvider({
      auth: {
        signOut: vi.fn(),
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: {
            status: 400,
            message: "Invalid login credentials for owner@example.test",
          },
        }),
      },
    });

    const result = await provider.authenticate({
      email: "owner@example.test",
      password: "password-secret",
    });

    expect(result).toEqual({ status: "rejected" });
    expect(JSON.stringify(result)).not.toContain("owner@example.test");
    expect(JSON.stringify(result)).not.toContain("Invalid login");
  });

  it("maps provider outages to a safe unavailable result", async () => {
    const provider = new SupabaseOwnerAuthProvider({
      auth: {
        signOut: vi.fn(),
        signInWithPassword: vi.fn().mockRejectedValue(new Error("DNS secret")),
      },
    });

    const result = await provider.authenticate({
      email: "owner@example.test",
      password: "password-secret",
    });

    expect(result).toEqual({ status: "unavailable" });
    expect(JSON.stringify(result)).not.toContain("DNS secret");
  });

  it("fails closed when Supabase returns no error and no verified user", async () => {
    const provider = new SupabaseOwnerAuthProvider({
      auth: {
        signOut: vi.fn(),
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: null,
        }),
      },
    });

    await expect(
      provider.authenticate({
        email: "owner@example.test",
        password: "password-secret",
      }),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("terminates only the current local provider session", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const provider = new SupabaseOwnerAuthProvider({
      auth: { signInWithPassword: vi.fn(), signOut },
    });

    await expect(provider.terminateSession()).resolves.toBeUndefined();
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
