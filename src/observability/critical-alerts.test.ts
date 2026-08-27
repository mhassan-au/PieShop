import { describe, expect, it, vi } from "vitest";

import {
  createCriticalAlertDispatcher,
  InMemoryAlertGate,
  type CriticalAlertTransport,
} from "./critical-alerts";
import type { StructuredLogEvent } from "./logger";

const event: StructuredLogEvent = {
  schemaVersion: 1,
  timestamp: "2026-08-27T03:04:05.006Z",
  level: "fatal",
  environment: "test",
  service: "orders-api",
  event: "database.connection_failed",
  errorCode: "DATABASE_UNAVAILABLE",
  requestId: "req_safe",
  traceId: "trace_safe",
  referenceId: "err_safe",
  outcome: "failed",
  securityRelevant: false,
  context: {
    password: "synthetic-password",
    phone: "+61 400 000 123",
  },
};

describe("critical alert dispatcher", () => {
  it("sends a sanitised Telegram-ready alert", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const dispatcher = createCriticalAlertDispatcher({
      transport: { send } satisfies CriticalAlertTransport,
      gate: new InMemoryAlertGate(),
      clock: () => 1_000,
      deduplicationMs: 60_000,
      windowMs: 60_000,
      maximumPerWindow: 5,
    });

    await expect(dispatcher.dispatch(event)).resolves.toEqual({
      outcome: "sent",
    });
    const message = String(send.mock.calls[0]?.[0]);
    expect(message).toContain("[TEST] PieShop critical alert");
    expect(message).toContain("DATABASE_UNAVAILABLE");
    expect(message).toContain("req_safe");
    expect(message).not.toContain("synthetic-password");
    expect(message).not.toContain("+61");
    expect(message).not.toContain("context");
  });

  it("deduplicates the same alert fingerprint", async () => {
    const transport = { send: vi.fn().mockResolvedValue(undefined) };
    const dispatcher = createCriticalAlertDispatcher({
      transport,
      gate: new InMemoryAlertGate(),
      clock: () => 1_000,
      deduplicationMs: 60_000,
      windowMs: 60_000,
      maximumPerWindow: 5,
    });

    await expect(dispatcher.dispatch(event)).resolves.toEqual({
      outcome: "sent",
    });
    await expect(dispatcher.dispatch(event)).resolves.toEqual({
      outcome: "deduplicated",
    });
    expect(transport.send).toHaveBeenCalledOnce();
  });

  it("rate limits distinct alerts in a window", async () => {
    const transport = { send: vi.fn().mockResolvedValue(undefined) };
    const dispatcher = createCriticalAlertDispatcher({
      transport,
      gate: new InMemoryAlertGate(),
      clock: () => 1_000,
      deduplicationMs: 60_000,
      windowMs: 60_000,
      maximumPerWindow: 1,
    });

    await dispatcher.dispatch(event);
    await expect(
      dispatcher.dispatch({ ...event, event: "jobs.queue_failed" }),
    ).resolves.toEqual({ outcome: "rate_limited" });
  });

  it("isolates transport failure from the original operation", async () => {
    const dispatcher = createCriticalAlertDispatcher({
      transport: {
        send: vi.fn().mockRejectedValue(new Error("Telegram unavailable")),
      },
      gate: new InMemoryAlertGate(),
      clock: () => 1_000,
      deduplicationMs: 60_000,
      windowMs: 60_000,
      maximumPerWindow: 5,
    });

    await expect(dispatcher.dispatch(event)).resolves.toEqual({
      outcome: "failed",
    });
  });
});
