import * as Sentry from "@sentry/nextjs";

import type { SentryClient, SentryCaptureHint } from "./sentry-reporter";

export function initializeSentry(dsn: string | undefined): boolean {
  if (!dsn) return false;

  Sentry.init({
    dsn,
    defaultIntegrations: false,
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });
  return true;
}

export function createSdkSentryClient(): SentryClient {
  return {
    async captureException(error: Error, hint: SentryCaptureHint) {
      const extra =
        typeof hint.extra === "object" &&
        hint.extra !== null &&
        !Array.isArray(hint.extra)
          ? hint.extra
          : { value: hint.extra };

      return Sentry.captureException(error, {
        level: hint.level,
        tags: hint.tags,
        extra,
      });
    },
  };
}
