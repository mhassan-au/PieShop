import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import { config } from "./proxy";

describe("authentication refresh proxy matcher", () => {
  it.each(["/control", "/control/sessions", "/control/merchants/one"])(
    "matches protected owner path %s",
    (url) => {
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
    },
  );

  it.each(["/", "/login", "/api/public"])(
    "does not match public path %s",
    (url) => {
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false);
    },
  );
});
