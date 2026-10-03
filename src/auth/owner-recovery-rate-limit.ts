import { createHmac, randomBytes } from "node:crypto";

const key = randomBytes(32);
const attempts = new Map<string, number[]>();
const WINDOW_MS = 15 * 60_000;

function consume(value: string, maximum: number, now: number) {
  const active = (attempts.get(value) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );
  if (active.length >= maximum) return false;
  active.push(now);
  attempts.set(value, active);
  return true;
}

const digest = (kind: string, value: string) =>
  createHmac("sha256", key).update(`${kind}\0${value}`).digest("hex");

export function allowOwnerRecoveryRequest(
  email: string,
  source: string,
  now = Date.now(),
) {
  return (
    consume(digest("account", email), 3, now) &&
    consume(digest("source", source), 10, now)
  );
}
