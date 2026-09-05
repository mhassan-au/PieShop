export const MERCHANT_SESSION_ABSOLUTE_MILLISECONDS = 30 * 24 * 60 * 60 * 1000;

export type MerchantSessionRecord = Readonly<{
  id: string;
  userId: string;
  businessId: string;
  createdAt: string;
  absoluteExpiresAt: string;
  revokedAt: string | null;
}>;

export type MerchantSessionEvaluation =
  | Readonly<{ status: "valid" }>
  | Readonly<{
      status: "denied";
      reason: "absolute_expired" | "revoked" | "invalid";
    }>;

function parseCanonicalInstant(value: string): number | null {
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) return null;
  return new Date(milliseconds).toISOString() === value ? milliseconds : null;
}

export function createMerchantSessionRecord(
  id: string,
  userId: string,
  businessId: string,
  createdAt: string,
): MerchantSessionRecord {
  const createdMilliseconds = parseCanonicalInstant(createdAt);
  if (createdMilliseconds === null)
    throw new Error("Merchant session timestamp is invalid");
  return {
    id,
    userId,
    businessId,
    createdAt,
    absoluteExpiresAt: new Date(
      createdMilliseconds + MERCHANT_SESSION_ABSOLUTE_MILLISECONDS,
    ).toISOString(),
    revokedAt: null,
  };
}

export function evaluateMerchantSession(
  session: MerchantSessionRecord,
  now: string,
): MerchantSessionEvaluation {
  const nowMilliseconds = parseCanonicalInstant(now);
  const createdMilliseconds = parseCanonicalInstant(session.createdAt);
  const expiresMilliseconds = parseCanonicalInstant(session.absoluteExpiresAt);
  if (
    nowMilliseconds === null ||
    createdMilliseconds === null ||
    expiresMilliseconds === null ||
    nowMilliseconds < createdMilliseconds ||
    expiresMilliseconds !==
      createdMilliseconds + MERCHANT_SESSION_ABSOLUTE_MILLISECONDS
  )
    return { status: "denied", reason: "invalid" };
  if (session.revokedAt !== null)
    return { status: "denied", reason: "revoked" };
  if (nowMilliseconds >= expiresMilliseconds)
    return { status: "denied", reason: "absolute_expired" };
  return { status: "valid" };
}
