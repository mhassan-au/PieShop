import { describe, expect, it, vi } from "vitest";

import {
  clearOwnerSessionCookie,
  OWNER_SESSION_MAX_AGE_SECONDS,
  readOwnerSessionCookie,
  setOwnerSessionCookie,
} from "./owner-session-cookie";

const VALID_TOKEN = "A".repeat(43);

function createCookieStore(value?: string) {
  return {
    delete: vi.fn(),
    get: vi.fn(() => (value === undefined ? undefined : { value })),
    set: vi.fn(),
  };
}

describe("owner session cookie", () => {
  it("uses a host-bound secure cookie outside local development", () => {
    const store = createCookieStore();

    setOwnerSessionCookie(store, VALID_TOKEN, "staging");

    expect(store.set).toHaveBeenCalledWith(
      "__Host-pieshop_owner_session",
      VALID_TOKEN,
      {
        httpOnly: true,
        maxAge: OWNER_SESSION_MAX_AGE_SECONDS,
        path: "/",
        priority: "high",
        sameSite: "lax",
        secure: true,
      },
    );
  });

  it("uses a localhost-compatible cookie only in local and test environments", () => {
    for (const environment of ["local", "test"] as const) {
      const store = createCookieStore();
      setOwnerSessionCookie(store, VALID_TOKEN, environment);

      expect(store.set).toHaveBeenCalledWith(
        "pieshop_owner_session",
        VALID_TOKEN,
        expect.objectContaining({ secure: false }),
      );
    }
  });

  it("reads only the environment-appropriate cookie", () => {
    const store = createCookieStore(VALID_TOKEN);

    expect(readOwnerSessionCookie(store, "production")).toBe(VALID_TOKEN);
    expect(store.get).toHaveBeenCalledWith("__Host-pieshop_owner_session");
  });

  it("rejects malformed cookie values before persistence lookup", () => {
    const store = createCookieStore("malformed-token");

    expect(readOwnerSessionCookie(store, "production")).toBeNull();
  });

  it("clears the cookie using the same security scope", () => {
    const store = createCookieStore();

    clearOwnerSessionCookie(store, "production");

    expect(store.set).toHaveBeenCalledWith("__Host-pieshop_owner_session", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
      priority: "high",
      sameSite: "lax",
      secure: true,
    });
  });
});
