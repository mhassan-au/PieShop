import type { AppError } from "@/errors/app-error";

import { redact, redactScalar } from "./redaction";

export type SentryCaptureHint = {
  level: "debug" | "info" | "warning" | "error" | "fatal";
  tags: Record<string, string>;
  extra: ReturnType<typeof redact>;
};

export interface SentryClient {
  captureException(
    error: Error,
    hint: SentryCaptureHint,
  ): string | undefined | Promise<string | undefined>;
}

export function createSentryReporter(client: SentryClient) {
  return {
    async report(error: AppError): Promise<{
      outcome: "reported" | "failed";
      providerEventId?: string;
    }> {
      const safeError = new Error(
        `${redactScalar(error.code)} (${redactScalar(error.referenceId)})`,
      );
      safeError.name = "PieShopAppError";

      try {
        const providerEventId = await client.captureException(safeError, {
          level: error.severity,
          tags: {
            errorCode: redactScalar(error.code),
            referenceId: redactScalar(error.referenceId),
          },
          extra: redact({
            safeContext: error.safeContext,
            requestId: error.requestId,
            traceId: error.traceId,
            isRetryable: error.isRetryable,
          }),
        });

        return {
          outcome: "reported",
          ...(providerEventId ? { providerEventId } : {}),
        };
      } catch {
        return { outcome: "failed" };
      }
    },
  };
}
