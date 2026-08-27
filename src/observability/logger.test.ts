import { describe, expect, it } from "vitest";

import {
  createLogger,
  serializeJsonLine,
  type LogSink,
  type StructuredLogEvent,
} from "./logger";

class MemorySink implements LogSink {
  readonly events: StructuredLogEvent[] = [];

  write(event: StructuredLogEvent) {
    this.events.push(event);
  }
}

const fixedClock = () => new Date("2026-08-27T03:04:05.006Z");

describe("structured logger", () => {
  it("emits a correlated UTC event and redacts nested sensitive data", async () => {
    const sink = new MemorySink();
    const logger = createLogger({
      environment: "test",
      service: "web",
      minimumLevel: "debug",
      sink,
      clock: fixedClock,
    });

    await logger.debug("catalogue.preview_opened", {
      outcome: "success",
      requestId: "req_demo",
      traceId: "trace_demo",
      context: {
        actorId: "actor_safe",
        password: "synthetic-password",
        nested: {
          phone: "+61 400 000 123",
          deliveryAddress: "12 Example Street",
          bankAccount: "123-456 12345678",
          payId: "payid@example.test",
          accessToken: "token_synthetic_123456789",
        },
      },
    });

    expect(sink.events).toEqual([
      {
        schemaVersion: 1,
        timestamp: "2026-08-27T03:04:05.006Z",
        level: "debug",
        environment: "test",
        service: "web",
        event: "catalogue.preview_opened",
        outcome: "success",
        requestId: "req_demo",
        traceId: "trace_demo",
        context: {
          actorId: "actor_safe",
          password: "[REDACTED]",
          nested: {
            phone: "[REDACTED]",
            deliveryAddress: "[REDACTED]",
            bankAccount: "[REDACTED]",
            payId: "[REDACTED]",
            accessToken: "[REDACTED]",
          },
        },
      },
    ]);
  });

  it("suppresses debug below the configured threshold", async () => {
    const sink = new MemorySink();
    const logger = createLogger({
      environment: "test",
      service: "web",
      minimumLevel: "info",
      sink,
      clock: fixedClock,
    });

    await logger.debug("app.debug_hidden", { outcome: "success" });
    await logger.info("app.ready", { outcome: "success" });

    expect(sink.events.map((event) => event.event)).toEqual(["app.ready"]);
  });

  it("enables debug through explicit debug mode without weakening redaction", async () => {
    const sink = new MemorySink();
    const logger = createLogger({
      environment: "test",
      service: "web",
      minimumLevel: "info",
      debugMode: true,
      sink,
      clock: fixedClock,
    });

    await logger.debug("app.debug_visible", {
      outcome: "success",
      context: { password: "synthetic-password" },
    });

    expect(sink.events[0]?.level).toBe("debug");
    expect(sink.events[0]?.context).toEqual({ password: "[REDACTED]" });
  });

  it("redacts unsafe correlation identifiers", async () => {
    const sink = new MemorySink();
    const logger = createLogger({
      environment: "test",
      service: "web",
      minimumLevel: "info",
      sink,
      clock: fixedClock,
    });

    await logger.info("app.identifier_checked", {
      outcome: "success",
      requestId: "+61 400 000 123\nforged",
    });

    expect(sink.events[0]?.requestId).toBe("[REDACTED]");
  });

  it("keeps newline payloads inside one JSONL record", async () => {
    const sink = new MemorySink();
    const logger = createLogger({
      environment: "test",
      service: "web",
      minimumLevel: "debug",
      sink,
      clock: fixedClock,
    });

    await logger.warn("security.input_rejected", {
      outcome: "rejected",
      context: { reason: "first line\nforged event" },
    });

    const line = serializeJsonLine(sink.events[0]!);
    expect(line.split("\n")).toHaveLength(2);
    expect(line).toContain("first line\\nforged event");
  });

  it("rejects unstable event names", async () => {
    const logger = createLogger({
      environment: "test",
      service: "web",
      minimumLevel: "debug",
      sink: new MemorySink(),
      clock: fixedClock,
    });

    await expect(
      logger.info("invalid event\nforged", { outcome: "rejected" }),
    ).rejects.toThrow("Log event name is invalid");
  });
});
