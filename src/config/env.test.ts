import { describe, expect, it } from "vitest";

import { parseEnvironment } from "./env";

describe("parseEnvironment", () => {
  it("accepts safe local configuration", () => {
    expect(
      parseEnvironment({
        APP_ENV: "local",
        APP_BASE_URL: "http://localhost:3000",
      }),
    ).toEqual({
      APP_ENV: "local",
      APP_BASE_URL: "http://localhost:3000",
    });
  });

  it("rejects a missing base URL without echoing unrelated secrets", () => {
    const secret = "do-not-print-this-secret";

    expect(() =>
      parseEnvironment({ APP_ENV: "production", SECRET_VALUE: secret }),
    ).toThrow("Application configuration is invalid");

    try {
      parseEnvironment({ APP_ENV: "production", SECRET_VALUE: secret });
    } catch (error) {
      expect(String(error)).not.toContain(secret);
    }
  });

  it("rejects unsupported environments", () => {
    expect(() =>
      parseEnvironment({
        APP_ENV: "preview",
        APP_BASE_URL: "https://preview.example.test",
      }),
    ).toThrow("Application configuration is invalid");
  });
});
