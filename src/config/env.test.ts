import { describe, expect, it } from "vitest";

import { loadEnvironment, parseEnvironment } from "./env";

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

  it("requires the public Supabase URL and publishable key as a pair", () => {
    expect(() =>
      parseEnvironment({
        APP_ENV: "local",
        APP_BASE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
      }),
    ).toThrow("Application configuration is invalid");
  });

  it("uses the localhost base URL when an explicit local environment omits it", () => {
    expect(loadEnvironment({ APP_ENV: "local" }).APP_BASE_URL).toBe(
      "http://localhost:3000",
    );
  });

  it("accepts only complete local Mailtrap sandbox configuration", () => {
    expect(
      parseEnvironment({
        APP_ENV: "local",
        APP_BASE_URL: "http://localhost:3000",
        MAILTRAP_SMTP_HOST: "sandbox.smtp.mailtrap.io",
        MAILTRAP_SMTP_PORT: "2525",
        MAILTRAP_SMTP_USERNAME: "synthetic-user",
        MAILTRAP_SMTP_PASSWORD: "synthetic-password",
        MAIL_FROM_EMAIL: "no-reply@pieshop.test",
        MAIL_FROM_NAME: "PieShop",
      }).MAILTRAP_SMTP_PORT,
    ).toBe(2525);
    expect(() =>
      parseEnvironment({
        APP_ENV: "local",
        APP_BASE_URL: "http://localhost:3000",
        MAILTRAP_SMTP_USERNAME: "partial",
      }),
    ).toThrow("MAILTRAP_SMTP_CONFIGURATION");
    expect(() =>
      parseEnvironment({
        APP_ENV: "production",
        APP_BASE_URL: "https://example.test",
        MAILTRAP_SMTP_HOST: "sandbox.smtp.mailtrap.io",
        MAILTRAP_SMTP_PORT: "2525",
        MAILTRAP_SMTP_USERNAME: "synthetic-user",
        MAILTRAP_SMTP_PASSWORD: "synthetic-password",
        MAIL_FROM_EMAIL: "no-reply@pieshop.test",
        MAIL_FROM_NAME: "PieShop",
      }),
    ).toThrow("MAILTRAP_SMTP_CONFIGURATION");
  });
});
