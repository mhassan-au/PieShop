import { beforeEach, describe, expect, it, vi } from "vitest";

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn().mockReturnValue("sentry-event-id"),
}));

vi.mock("@sentry/nextjs", () => sentry);

import { createSdkSentryClient, initializeSentry } from "./sentry-sdk";

describe("Sentry SDK boundary", () => {
  beforeEach(() => {
    sentry.init.mockClear();
    sentry.captureException.mockClear();
  });

  it("stays disabled without a DSN", () => {
    expect(initializeSentry(undefined)).toBe(false);
    expect(sentry.init).not.toHaveBeenCalled();
  });

  it("initialises without default capture or PII", () => {
    expect(initializeSentry("https://public@example.test/1")).toBe(true);
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://public@example.test/1",
        defaultIntegrations: false,
        sendDefaultPii: false,
        tracesSampleRate: 0,
      }),
    );
  });

  it("forwards only the already-sanitised reporter contract", async () => {
    const client = createSdkSentryClient();
    const safeError = new Error("CONFLICT (err_safe)");

    await expect(
      client.captureException(safeError, {
        level: "error",
        tags: { errorCode: "CONFLICT", referenceId: "err_safe" },
        extra: { requestId: "req_safe" },
      }),
    ).resolves.toBe("sentry-event-id");
    expect(sentry.captureException).toHaveBeenCalledWith(
      safeError,
      expect.objectContaining({
        tags: { errorCode: "CONFLICT", referenceId: "err_safe" },
      }),
    );
  });
});
