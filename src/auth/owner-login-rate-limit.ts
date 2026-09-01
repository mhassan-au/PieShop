import { createHmac, randomBytes } from "node:crypto";

type Limit = Readonly<{
  maximumAttempts: number;
  windowMs: number;
}>;

export type OwnerLoginRateLimitPolicy = Readonly<{
  account: Limit;
  source: Limit;
}>;

export interface OwnerLoginRateLimiter {
  consume(
    normalizedAccount: string,
    source: string,
    now: number,
  ): Promise<
    Readonly<{ status: "allowed" }> | Readonly<{ status: "throttled" }>
  >;
  resetAccount(normalizedAccount: string): Promise<void>;
}

type Options = Readonly<{
  policy: OwnerLoginRateLimitPolicy;
  digestKey?: Uint8Array;
}>;

function normalizeAccount(value: string): string {
  return value.trim().toLowerCase();
}

export function createProcessLocalOwnerLoginRateLimiter(options: Options) {
  const digestKey = options.digestKey ?? randomBytes(32);
  const attempts = new Map<string, number[]>();

  function digest(kind: "account" | "source", value: string): string {
    return createHmac("sha256", digestKey)
      .update(`${kind}\u0000${value}`)
      .digest("hex");
  }

  function consumeKey(key: string, limit: Limit, now: number): boolean {
    const active = (attempts.get(key) ?? []).filter(
      (timestamp) => now - timestamp < limit.windowMs,
    );
    if (active.length >= limit.maximumAttempts) {
      attempts.set(key, active);
      return false;
    }
    active.push(now);
    attempts.set(key, active);
    return true;
  }

  return {
    async consume(normalizedAccount: string, source: string, now: number) {
      const accountKey = digest("account", normalizeAccount(normalizedAccount));
      const sourceKey = digest("source", source);
      const accountAllowed = consumeKey(
        accountKey,
        options.policy.account,
        now,
      );
      const sourceAllowed = consumeKey(sourceKey, options.policy.source, now);
      return {
        status: accountAllowed && sourceAllowed ? "allowed" : "throttled",
      } as const;
    },

    async resetAccount(normalizedAccount: string) {
      attempts.delete(digest("account", normalizeAccount(normalizedAccount)));
    },

    inspectKeysForTest() {
      return [...attempts.keys()];
    },
  };
}

export const processLocalOwnerLoginRateLimiter =
  createProcessLocalOwnerLoginRateLimiter({
    policy: {
      account: { maximumAttempts: 5, windowMs: 15 * 60_000 },
      source: { maximumAttempts: 20, windowMs: 15 * 60_000 },
    },
  });
