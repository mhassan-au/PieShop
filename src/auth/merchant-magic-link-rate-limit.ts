import { createHmac, randomBytes } from "node:crypto";

const digestKey = randomBytes(32);
const attempts = new Map<string, number[]>();
const WINDOW_MS = 15 * 60_000;

function consume(key: string, maximum: number, now: number): boolean {
  const active = (attempts.get(key) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );
  if (active.length >= maximum) {
    attempts.set(key, active);
    return false;
  }
  active.push(now);
  attempts.set(key, active);
  return true;
}

function digest(kind: string, value: string): string {
  return createHmac("sha256", digestKey)
    .update(`${kind}\u0000${value}`)
    .digest("hex");
}

export function allowMerchantMagicLinkRequest(
  normalizedEmail: string,
  source: string,
  now = Date.now(),
): boolean {
  const accountAllowed = consume(digest("account", normalizedEmail), 3, now);
  const sourceAllowed = consume(digest("source", source), 20, now);
  return accountAllowed && sourceAllowed;
}
