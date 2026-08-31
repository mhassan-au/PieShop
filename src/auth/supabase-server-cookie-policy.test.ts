import { describe, expect, it, vi } from "vitest";

import { createSupabaseServerCookieMethods } from "./supabase-server-cookie-policy";

function createStore() {
  return {
    getAll: vi.fn(() => [{ name: "provider-cookie", value: "secret-value" }]),
    set: vi.fn(),
  };
}

describe("Supabase server cookie policy", () => {
  it("passes request cookies to the server auth client", () => {
    const store = createStore();
    const methods = createSupabaseServerCookieMethods(store, "production");

    expect(methods.getAll()).toEqual([
      { name: "provider-cookie", value: "secret-value" },
    ]);
  });

  it("hardens every provider cookie outside local development", () => {
    const store = createStore();
    const methods = createSupabaseServerCookieMethods(store, "staging");

    methods.setAll?.(
      [
        {
          name: "provider-cookie",
          value: "secret-value",
          options: {
            domain: "unsafe.example",
            httpOnly: false,
            sameSite: "none",
          },
        },
      ],
      {},
    );

    expect(store.set).toHaveBeenCalledWith("provider-cookie", "secret-value", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  it("allows insecure transport only for local and test HTTP", () => {
    for (const environment of ["local", "test"] as const) {
      const store = createStore();
      createSupabaseServerCookieMethods(store, environment).setAll?.(
        [{ name: "provider-cookie", value: "secret-value", options: {} }],
        {},
      );

      expect(store.set).toHaveBeenCalledWith(
        "provider-cookie",
        "secret-value",
        expect.objectContaining({ httpOnly: true, secure: false }),
      );
    }
  });

  it("forwards provider no-cache headers to response-capable boundaries", () => {
    const store = createStore();
    const setResponseHeaders = vi.fn();
    const methods = createSupabaseServerCookieMethods(
      store,
      "production",
      setResponseHeaders,
    );

    methods.setAll?.([], {
      "Cache-Control": "private, no-store",
      Pragma: "no-cache",
    });

    expect(setResponseHeaders).toHaveBeenCalledWith({
      "Cache-Control": "private, no-store",
      Pragma: "no-cache",
    });
  });
});
