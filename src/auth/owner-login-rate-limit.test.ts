import { describe, expect, it } from "vitest";

import { createProcessLocalOwnerLoginRateLimiter } from "./owner-login-rate-limit";

const policy = {
  account: { maximumAttempts: 2, windowMs: 60_000 },
  source: { maximumAttempts: 3, windowMs: 60_000 },
} as const;

describe("process-local owner login rate limiter", () => {
  it("bounds attempts for a normalized account without retaining its email", async () => {
    const limiter = createProcessLocalOwnerLoginRateLimiter({
      policy,
      digestKey: Buffer.alloc(32, 7),
    });

    await expect(
      limiter.consume(" Owner@Example.Test ", "source-a", 1_000),
    ).resolves.toEqual({ status: "allowed" });
    await expect(
      limiter.consume("owner@example.test", "source-b", 2_000),
    ).resolves.toEqual({ status: "allowed" });
    await expect(
      limiter.consume("OWNER@example.test", "source-c", 3_000),
    ).resolves.toEqual({ status: "throttled" });

    expect(limiter.inspectKeysForTest().join(" ")).not.toContain(
      "owner@example.test",
    );
  });

  it("bounds attempts from one source across different accounts", async () => {
    const limiter = createProcessLocalOwnerLoginRateLimiter({
      policy,
      digestKey: Buffer.alloc(32, 8),
    });

    for (const email of [
      "one@example.test",
      "two@example.test",
      "three@example.test",
    ]) {
      await expect(limiter.consume(email, "source-a", 1_000)).resolves.toEqual({
        status: "allowed",
      });
    }
    await expect(
      limiter.consume("four@example.test", "source-a", 1_000),
    ).resolves.toEqual({ status: "throttled" });
  });

  it("allows attempts after the injected window expires", async () => {
    const limiter = createProcessLocalOwnerLoginRateLimiter({
      policy,
      digestKey: Buffer.alloc(32, 9),
    });

    await limiter.consume("owner@example.test", "source-a", 1_000);
    await limiter.consume("owner@example.test", "source-a", 2_000);

    await expect(
      limiter.consume("owner@example.test", "source-a", 61_001),
    ).resolves.toEqual({ status: "allowed" });
  });

  it("resets only the successful account while retaining the source bound", async () => {
    const limiter = createProcessLocalOwnerLoginRateLimiter({
      policy,
      digestKey: Buffer.alloc(32, 10),
    });

    await limiter.consume("owner@example.test", "source-a", 1_000);
    await limiter.resetAccount("owner@example.test");

    await expect(
      limiter.consume("owner@example.test", "source-b", 2_000),
    ).resolves.toEqual({ status: "allowed" });
    await expect(
      limiter.consume("other@example.test", "source-a", 3_000),
    ).resolves.toEqual({ status: "allowed" });
  });
});
