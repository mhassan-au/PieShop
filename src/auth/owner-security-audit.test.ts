import { describe, expect, it } from "vitest";

import { InMemoryLogSink, createLogger } from "@/observability/logger";

import { createOwnerSecurityAudit } from "./owner-security-audit";

describe("owner authentication security audit", () => {
  it("records anonymous failures without account or source data", async () => {
    const sink = new InMemoryLogSink();
    const audit = createOwnerSecurityAudit(
      createLogger({
        environment: "test",
        service: "web",
        minimumLevel: "debug",
        sink,
        clock: () => new Date("2026-09-01T00:00:00.000Z"),
      }),
      "request-safe-1",
    );

    await audit.record("auth.login.failed", { outcome: "rejected" });

    expect(sink.events).toEqual([
      expect.objectContaining({
        timestamp: "2026-09-01T00:00:00.000Z",
        event: "auth.login.failed",
        outcome: "rejected",
        requestId: "request-safe-1",
        securityRelevant: true,
      }),
    ]);
    expect(JSON.stringify(sink.events)).not.toMatch(
      /email|password|token|cookie|source/iu,
    );
  });

  it("claims an actor only when an authenticated identity is supplied", async () => {
    const sink = new InMemoryLogSink();
    const audit = createOwnerSecurityAudit(
      createLogger({
        environment: "test",
        service: "web",
        minimumLevel: "debug",
        sink,
      }),
      "request-safe-2",
    );

    await audit.record("auth.login.succeeded", {
      outcome: "authenticated",
      actorId: "auth-user-1",
    });

    expect(sink.events[0]?.context).toEqual({ actorId: "auth-user-1" });
  });
});
