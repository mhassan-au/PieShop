import { redact, redactScalar } from "./redaction";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogEnvironment = "local" | "test" | "staging" | "production";

export type StructuredLogEvent = {
  schemaVersion: 1;
  timestamp: string;
  level: LogLevel;
  environment: LogEnvironment;
  service: string;
  event: string;
  outcome: string;
  errorCode?: string;
  requestId?: string;
  traceId?: string;
  referenceId?: string;
  businessId?: string;
  orderId?: string;
  durationMs?: number;
  securityRelevant?: boolean;
  context?: ReturnType<typeof redact>;
};

export type LogInput = Omit<
  StructuredLogEvent,
  "schemaVersion" | "timestamp" | "level" | "environment" | "service" | "event"
> & { context?: Record<string, unknown> };

export interface LogSink {
  write(event: StructuredLogEvent): void | Promise<void>;
}

export class InMemoryLogSink implements LogSink {
  readonly events: StructuredLogEvent[] = [];

  write(event: StructuredLogEvent): void {
    this.events.push(event);
  }
}

type LoggerOptions = {
  environment: LogEnvironment;
  service: string;
  minimumLevel: LogLevel;
  debugMode?: boolean;
  sink: LogSink;
  clock?: () => Date;
};

const levelRank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

const eventNamePattern = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u;

export function serializeJsonLine(event: StructuredLogEvent): string {
  return `${JSON.stringify(event)}\n`;
}

export class ConsoleLogSink implements LogSink {
  write(event: StructuredLogEvent): void {
    const line = serializeJsonLine(event).trimEnd();

    if (event.level === "error" || event.level === "fatal") {
      console.error(line);
    } else if (event.level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  }
}

export function createLogger(options: LoggerOptions) {
  const clock = options.clock ?? (() => new Date());
  const effectiveMinimumLevel = options.debugMode
    ? "debug"
    : options.minimumLevel;

  async function emit(
    level: LogLevel,
    eventName: string,
    input: LogInput,
  ): Promise<{ emitted: boolean }> {
    if (!eventNamePattern.test(eventName)) {
      throw new Error("Log event name is invalid");
    }
    if (levelRank[level] < levelRank[effectiveMinimumLevel]) {
      return { emitted: false };
    }

    const event: StructuredLogEvent = {
      schemaVersion: 1,
      timestamp: clock().toISOString(),
      level,
      environment: options.environment,
      service: redactScalar(options.service),
      event: eventName,
      outcome: redactScalar(input.outcome),
      ...(input.errorCode ? { errorCode: redactScalar(input.errorCode) } : {}),
      ...(input.requestId ? { requestId: redactScalar(input.requestId) } : {}),
      ...(input.traceId ? { traceId: redactScalar(input.traceId) } : {}),
      ...(input.referenceId
        ? { referenceId: redactScalar(input.referenceId) }
        : {}),
      ...(input.businessId
        ? { businessId: redactScalar(input.businessId) }
        : {}),
      ...(input.orderId ? { orderId: redactScalar(input.orderId) } : {}),
      ...(input.durationMs === undefined
        ? {}
        : { durationMs: input.durationMs }),
      ...(input.securityRelevant === undefined
        ? {}
        : { securityRelevant: input.securityRelevant }),
      ...(input.context ? { context: redact(input.context) } : {}),
    };

    try {
      await options.sink.write(event);
      return { emitted: true };
    } catch {
      return { emitted: false };
    }
  }

  return {
    debug: (event: string, input: LogInput) => emit("debug", event, input),
    info: (event: string, input: LogInput) => emit("info", event, input),
    warn: (event: string, input: LogInput) => emit("warn", event, input),
    error: (event: string, input: LogInput) => emit("error", event, input),
    fatal: (event: string, input: LogInput) => emit("fatal", event, input),
  };
}
