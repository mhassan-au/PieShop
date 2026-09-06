import { describe, expect, it, vi } from "vitest";
import {
  clearInvitationBindingCookie,
  INVITATION_BINDING_MAX_AGE_SECONDS,
  readInvitationBindingCookie,
  setInvitationBindingCookie,
} from "./invitation-binding-cookie";

const hash = "a".repeat(64);

describe("invitation binding cookie", () => {
  it("stores only a short-lived hash in a hardened cookie", () => {
    const set = vi.fn();
    setInvitationBindingCookie({ get: vi.fn(), set }, hash, "production");
    expect(set).toHaveBeenCalledWith(
      "__Host-pieshop_invitation_binding",
      hash,
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 15 * 60,
      }),
    );
    expect(INVITATION_BINDING_MAX_AGE_SECONDS).toBe(900);
  });

  it("rejects malformed values and clears the exact cookie", () => {
    expect(
      readInvitationBindingCookie({ get: () => ({ value: hash }) }, "local"),
    ).toBe(hash);
    expect(
      readInvitationBindingCookie(
        { get: () => ({ value: "raw-token" }) },
        "local",
      ),
    ).toBeNull();
    const set = vi.fn();
    clearInvitationBindingCookie({ get: vi.fn(), set }, "local");
    expect(set).toHaveBeenCalledWith(
      "pieshop_invitation_binding",
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
  });
});
