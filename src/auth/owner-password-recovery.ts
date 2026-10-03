import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

export const OWNER_RECOVERY_GRANT_MAX_AGE_SECONDS = 10 * 60;
const grants = new Map<string, { userId: string; expiresAt: number }>();

const emailSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.email().max(254),
);

const passwordSchema = z
  .string()
  .min(8)
  .max(1024)
  .regex(/[a-z]/u)
  .regex(/[A-Z]/u)
  .regex(/[0-9]/u)
  .regex(/[^A-Za-z0-9]/u);

export function parseOwnerRecoveryEmail(value: unknown): string | null {
  const result = emailSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function parseOwnerRecoveryPassword(
  password: unknown,
  confirmation: unknown,
): string | null {
  if (password !== confirmation) return null;
  const result = passwordSchema.safeParse(password);
  return result.success ? result.data : null;
}

const hashGrant = (token: string) =>
  createHash("sha256").update(token, "utf8").digest("hex");

export async function issueOwnerRecoveryGrant(
  userId: string,
  now = Date.now(),
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  grants.set(hashGrant(token), {
    userId,
    expiresAt: now + OWNER_RECOVERY_GRANT_MAX_AGE_SECONDS * 1_000,
  });
  return token;
}

export async function consumeOwnerRecoveryGrant(
  token: string,
  userId: string,
  now = Date.now(),
): Promise<boolean> {
  if (!/^[A-Za-z0-9_-]{43}$/u.test(token)) return false;
  const key = hashGrant(token);
  const grant = grants.get(key);
  grants.delete(key);
  return Boolean(grant && grant.userId === userId && grant.expiresAt >= now);
}
