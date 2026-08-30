export const OWNER_SESSION_ABSOLUTE_MILLISECONDS = 12 * 60 * 60 * 1000;
export const OWNER_SESSION_IDLE_MILLISECONDS = 2 * 60 * 60 * 1000;

export type OwnerSessionRecord = Readonly<{
  id: string;
  userId: string;
  createdAt: string;
  lastActivityAt: string;
  absoluteExpiresAt: string;
  idleExpiresAt: string;
  revokedAt: string | null;
}>;

export type OwnerSessionEvaluation =
  | Readonly<{ status: "valid" }>
  | Readonly<{
      status: "denied";
      reason: "absolute_expired" | "idle_expired" | "revoked" | "invalid";
    }>;

function parseCanonicalInstant(value: string): number | null {
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) return null;
  return new Date(milliseconds).toISOString() === value ? milliseconds : null;
}

function toUtcInstant(milliseconds: number): string {
  return new Date(milliseconds).toISOString();
}

export function createOwnerSessionRecord(
  id: string,
  userId: string,
  createdAt: string,
): OwnerSessionRecord {
  const createdMilliseconds = parseCanonicalInstant(createdAt);
  if (createdMilliseconds === null) {
    throw new Error("Owner session timestamp is invalid");
  }

  return {
    id,
    userId,
    createdAt,
    lastActivityAt: createdAt,
    absoluteExpiresAt: toUtcInstant(
      createdMilliseconds + OWNER_SESSION_ABSOLUTE_MILLISECONDS,
    ),
    idleExpiresAt: toUtcInstant(
      createdMilliseconds + OWNER_SESSION_IDLE_MILLISECONDS,
    ),
    revokedAt: null,
  };
}

export function evaluateOwnerSession(
  session: OwnerSessionRecord,
  now: string,
): OwnerSessionEvaluation {
  const nowMilliseconds = parseCanonicalInstant(now);
  const createdMilliseconds = parseCanonicalInstant(session.createdAt);
  const lastActivityMilliseconds = parseCanonicalInstant(
    session.lastActivityAt,
  );
  const absoluteExpiresMilliseconds = parseCanonicalInstant(
    session.absoluteExpiresAt,
  );
  const idleExpiresMilliseconds = parseCanonicalInstant(session.idleExpiresAt);

  if (
    nowMilliseconds === null ||
    createdMilliseconds === null ||
    lastActivityMilliseconds === null ||
    absoluteExpiresMilliseconds === null ||
    idleExpiresMilliseconds === null ||
    nowMilliseconds < createdMilliseconds ||
    lastActivityMilliseconds < createdMilliseconds ||
    lastActivityMilliseconds > nowMilliseconds ||
    absoluteExpiresMilliseconds !==
      createdMilliseconds + OWNER_SESSION_ABSOLUTE_MILLISECONDS ||
    idleExpiresMilliseconds !==
      lastActivityMilliseconds + OWNER_SESSION_IDLE_MILLISECONDS
  ) {
    return { status: "denied", reason: "invalid" };
  }

  if (session.revokedAt !== null) {
    return { status: "denied", reason: "revoked" };
  }

  if (nowMilliseconds >= absoluteExpiresMilliseconds) {
    return { status: "denied", reason: "absolute_expired" };
  }

  if (nowMilliseconds >= idleExpiresMilliseconds) {
    return { status: "denied", reason: "idle_expired" };
  }

  return { status: "valid" };
}

export function recordOwnerSessionActivity(
  session: OwnerSessionRecord,
  occurredAt: string,
): OwnerSessionRecord {
  const evaluation = evaluateOwnerSession(session, occurredAt);
  const occurredAtMilliseconds = parseCanonicalInstant(occurredAt);

  if (evaluation.status !== "valid" || occurredAtMilliseconds === null) {
    throw new Error("Owner session activity is invalid");
  }

  return {
    ...session,
    lastActivityAt: occurredAt,
    idleExpiresAt: toUtcInstant(
      occurredAtMilliseconds + OWNER_SESSION_IDLE_MILLISECONDS,
    ),
  };
}
