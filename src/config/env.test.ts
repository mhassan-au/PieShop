import { describe, expect, it } from "vitest";

import { parseEnvironment } from "./env";

describe("parseEnvironment", () => {
  it("accepts safe local configuration", () => {
    expect(
      parseEnvironment({
        APP_ENV: "local",
        APP_BASE_URL: "http://localhost:3000",
        LOG_LEVEL: "debug",
        DEBUG_MODE: "true",
      }),
    ).toEqual({
      APP_ENV: "local",
      APP_BASE_URL: "http://localhost:3000",
      LOG_LEVEL: "debug",
      DEBUG_MODE: true,
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

  it("requires Telegram credentials as a pair without echoing either value", () => {
    const token = "synthetic-bot-token";

    expect(() =>
      parseEnvironment({
        APP_ENV: "test",
        APP_BASE_URL: "http://localhost:3000",
        LOG_LEVEL: "info",
        DEBUG_MODE: "false",
        TELEGRAM_ALERT_BOT_TOKEN: token,
      }),
    ).toThrow("Application configuration is invalid");

    try {
      parseEnvironment({
        APP_ENV: "test",
        APP_BASE_URL: "http://localhost:3000",
        LOG_LEVEL: "info",
        DEBUG_MODE: "false",
        TELEGRAM_ALERT_BOT_TOKEN: token,
      });
    } catch (error) {
      expect(String(error)).not.toContain(token);
    }
  });

  it("treats blank optional provider values as unconfigured", () => {
    expect(
      parseEnvironment({
        APP_ENV: "local",
        APP_BASE_URL: "http://localhost:3000",
        LOG_LEVEL: "debug",
        DEBUG_MODE: "true",
        SENTRY_DSN: "",
        NEXT_PUBLIC_SENTRY_DSN: "",
        TELEGRAM_ALERT_BOT_TOKEN: "",
        TELEGRAM_ALERT_CHAT_ID: "",
      }),
    ).toEqual({
      APP_ENV: "local",
      APP_BASE_URL: "http://localhost:3000",
      LOG_LEVEL: "debug",
      DEBUG_MODE: true,
    });
  });
});
