import type { StructuredLogEvent } from "./logger";
import { redactScalar } from "./redaction";

export interface CriticalAlertTransport {
  send(message: string): Promise<void>;
}

type GateDecision = "allowed" | "deduplicated" | "rate_limited";

export interface AlertGate {
  check(input: {
    fingerprint: string;
    now: number;
    deduplicationMs: number;
    windowMs: number;
    maximumPerWindow: number;
  }): GateDecision;
  release(fingerprint: string): void;
}

export class InMemoryAlertGate implements AlertGate {
  private readonly fingerprints = new Map<string, number>();
  private sentAt: number[] = [];

  check(input: {
    fingerprint: string;
    now: number;
    deduplicationMs: number;
    windowMs: number;
    maximumPerWindow: number;
  }): GateDecision {
    const previous = this.fingerprints.get(input.fingerprint);
    if (
      previous !== undefined &&
      input.now - previous < input.deduplicationMs
    ) {
      return "deduplicated";
    }

    this.sentAt = this.sentAt.filter(
      (timestamp) => input.now - timestamp < input.windowMs,
    );
    if (this.sentAt.length >= input.maximumPerWindow) return "rate_limited";

    this.fingerprints.set(input.fingerprint, input.now);
    this.sentAt.push(input.now);
    return "allowed";
  }

  release(fingerprint: string): void {
    this.fingerprints.delete(fingerprint);
  }
}

type DispatcherOptions = {
  transport: CriticalAlertTransport;
  gate: AlertGate;
  clock?: () => number;
  deduplicationMs: number;
  windowMs: number;
  maximumPerWindow: number;
};

function fingerprint(event: StructuredLogEvent): string {
  return [
    event.environment,
    event.service,
    event.event,
    event.errorCode ?? "none",
    event.outcome,
  ].join(":");
}

export function formatCriticalAlert(event: StructuredLogEvent): string {
  const environment = event.environment.toUpperCase();
  return [
    `[${environment}] PieShop critical alert`,
    `Time: ${redactScalar(event.timestamp)}`,
    `Service: ${redactScalar(event.service)}`,
    `Event: ${event.event}`,
    `Code: ${redactScalar(event.errorCode ?? "UNCLASSIFIED")}`,
    `Outcome: ${redactScalar(event.outcome)}`,
    ...(event.requestId ? [`Request: ${redactScalar(event.requestId)}`] : []),
    ...(event.traceId ? [`Trace: ${redactScalar(event.traceId)}`] : []),
    ...(event.referenceId
      ? [`Reference: ${redactScalar(event.referenceId)}`]
      : []),
    ...(event.businessId
      ? [`Business: ${redactScalar(event.businessId)}`]
      : []),
    ...(event.orderId ? [`Order: ${redactScalar(event.orderId)}`] : []),
    ...(event.context ? ["Sensitive fields: [REDACTED]"] : []),
  ].join("\n");
}

export function createCriticalAlertDispatcher(options: DispatcherOptions) {
  const clock = options.clock ?? Date.now;

  return {
    async dispatch(event: StructuredLogEvent): Promise<{
      outcome: "sent" | "deduplicated" | "rate_limited" | "failed" | "ignored";
    }> {
      if (event.level !== "fatal" && !event.securityRelevant) {
        return { outcome: "ignored" };
      }

      const eventFingerprint = fingerprint(event);
      const decision = options.gate.check({
        fingerprint: eventFingerprint,
        now: clock(),
        deduplicationMs: options.deduplicationMs,
        windowMs: options.windowMs,
        maximumPerWindow: options.maximumPerWindow,
      });
      if (decision !== "allowed") return { outcome: decision };

      try {
        await options.transport.send(formatCriticalAlert(event));
        return { outcome: "sent" };
      } catch {
        options.gate.release(eventFingerprint);
        return { outcome: "failed" };
      }
    },
  };
}
