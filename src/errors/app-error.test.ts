import { describe, expect, it } from "vitest";

import {
  AppError,
  createPublicErrorEnvelope,
  type PublicErrorEnvelope,
} from "./app-error";

describe("public application errors", () => {
  it("serialises a known error using central public copy", () => {
    const result = createPublicErrorEnvelope(
      new AppError({
        code: "VALIDATION_FAILED",
        publicMessageKey: "validation.phone.invalid",
        severity: "warning",
        isRetryable: false,
        internalCause: new Error("database detail"),
        safeContext: { field: "phone" },
        requestId: "req_validation",
        traceId: "trace_validation",
        referenceId: "err_validation",
      }),
    );

    expect(result).toEqual({
      status: 400,
      body: {
        error: {
          code: "VALIDATION_FAILED",
          message:
            "Enter a valid phone number, including the area or country code.",
          referenceId: "err_validation",
        },
      },
    } satisfies { status: number; body: PublicErrorEnvelope });
  });

  it("retains operational metadata without adding it to the public envelope", () => {
    const error = new AppError({
      code: "CONFLICT",
      publicMessageKey: "error.unexpected.message",
      severity: "warning",
      isRetryable: true,
      safeContext: { operation: "example", attempt: 2 },
      requestId: "req_example",
      traceId: "trace_example",
      referenceId: "err_example",
    });

    expect(error.severity).toBe("warning");
    expect(error.isRetryable).toBe(true);
    expect(error.safeContext).toEqual({ operation: "example", attempt: 2 });
    expect(error.requestId).toBe("req_example");
    expect(error.traceId).toBe("trace_example");

    const publicResult = JSON.stringify(createPublicErrorEnvelope(error));
    expect(publicResult).not.toContain("operation");
    expect(publicResult).not.toContain("req_example");
    expect(publicResult).not.toContain("trace_example");
  });

  it("does not expose an unknown error message, cause, stack, or secret", () => {
    const secret = "token_super_secret";
    const unknownError = new Error(`Database failed with ${secret}`, {
      cause: new Error("internal network address"),
    });

    const serialised = JSON.stringify(
      createPublicErrorEnvelope(unknownError, "err_unexpected"),
    );

    expect(serialised).toContain("Something went wrong");
    expect(serialised).toContain("err_unexpected");
    expect(serialised).not.toContain(secret);
    expect(serialised).not.toContain("Database failed");
    expect(serialised).not.toContain("internal network address");
    expect(serialised).not.toContain("stack");
  });
});
