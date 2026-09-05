import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;
const INVITATION_LIFETIME_MS = 24 * 60 * 60 * 1000;

export function createInvitationToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashInvitationToken(token: string): string {
  if (!TOKEN_PATTERN.test(token)) {
    throw new Error("Invalid invitation token");
  }
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function invitationExpiry(issuedAt: Date): Date {
  if (!Number.isFinite(issuedAt.getTime())) {
    throw new Error("Invalid invitation issue time");
  }
  return new Date(issuedAt.getTime() + INVITATION_LIFETIME_MS);
}

export function isInvitationExpired(expiresAt: Date, now: Date): boolean {
  if (
    !Number.isFinite(expiresAt.getTime()) ||
    !Number.isFinite(now.getTime())
  ) {
    throw new Error("Invalid invitation time");
  }
  return now.getTime() >= expiresAt.getTime();
}
