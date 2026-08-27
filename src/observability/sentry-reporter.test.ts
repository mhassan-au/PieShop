import { describe, expect, it, vi } from "vitest";

import { AppError } from "@/errors/app-error";

import { createSentryReporter } from "./sentry-reporter";

describe("Sentry reporter adapter", () => {
  it("reports a safe replacement exception and sanitised metadata", async () => {
    const captureException = vi.fn().mockReturnValue("provider-event-id");
    const reporter = createSentryReporter({ captureException });
    const originalCause = new Error("token_synthetic_secret");
    const error = new AppError({
      code: "CONFLICT",
      publicMessageKey: "error.unexpected.message",
      severity: "error",
      isRetryable: true,
      internalCause: originalCause,
      safeContext: {
        operation: "order.transition",
        phone: "+61 400 000 123",
      },
      requestId: "req_safe",
      traceId: "trace_safe",
      referenceId: "err_safe",
    });

    await expect(reporter.report(error)).resolves.toEqual({
      outcome: "reported",
      providerEventId: "provider-event-id",
    });

    const [reportedError, hint] = captureException.mock.calls[0]!;
    expect(reportedError).not.toBe(originalCause);
    expect(String(reportedError)).toContain("CONFLICT");
    expect(JSON.stringify(hint)).toContain("order.transition");
    expect(JSON.stringify(hint)).not.toContain("+61");
    expect(JSON.stringify(hint)).not.toContain("token_synthetic_secret");
  });

  it("isolates provider failure", async () => {
    const reporter = createSentryReporter({
      captureException: vi.fn(() => {
        throw new Error("provider unavailable");
      }),
    });
    const error = new AppError({
      code: "CONFLICT",
      publicMessageKey: "error.unexpected.message",
      severity: "error",
      isRetryable: true,
      referenceId: "err_safe",
    });

    await expect(reporter.report(error)).resolves.toEqual({
      outcome: "failed",
    });
  });
});
