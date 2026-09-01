import { parseOwnerLoginInput } from "./login-input";
import type { OwnerAuthProvider } from "./owner-auth-provider";
import {
  authorizePlatformOwner,
  type CurrentPlatformRoleRepository,
  type OwnerAssurancePolicy,
} from "./platform-owner-policy";
import type { OwnerLoginRateLimiter } from "./owner-login-rate-limit";
import type {
  OwnerSecurityAudit,
  OwnerSecurityEvent,
} from "./owner-security-audit";
import {
  createOpaqueSessionCredential,
  type OpaqueSessionCredential,
} from "./session-token";

type OwnerSessionWriter = {
  create(tokenHash: string, deviceLabel: string | null): Promise<string>;
};

type OwnerLoginDependencies = Readonly<{
  authProvider: OwnerAuthProvider;
  roleRepository: CurrentPlatformRoleRepository;
  sessionRepository: OwnerSessionWriter;
  assurancePolicy: OwnerAssurancePolicy;
  rateLimiter: OwnerLoginRateLimiter;
  clock?: () => number;
  securityAudit: OwnerSecurityAudit;
  createCredential?: () => Promise<OpaqueSessionCredential>;
}>;

export type OwnerLoginResult =
  | Readonly<{
      status: "authenticated";
      sessionId: string;
      sessionToken: string;
    }>
  | Readonly<{ status: "rejected" }>
  | Readonly<{ status: "throttled" }>
  | Readonly<{ status: "unavailable" }>;

function normalizeDeviceLabel(value: string | null): string | null {
  if (value === null) return null;
  const safeValue = value
    .replace(/[\u0000-\u001f\u007f]/gu, "")
    .trim()
    .slice(0, 120);
  return safeValue || null;
}

async function terminateSafely(provider: OwnerAuthProvider): Promise<boolean> {
  try {
    await provider.terminateSession();
    return true;
  } catch {
    return false;
  }
}

async function auditSafely(
  audit: OwnerSecurityAudit,
  event: OwnerSecurityEvent,
  input: Readonly<{ outcome: string; actorId?: string }>,
): Promise<void> {
  try {
    await audit.record(event, input);
  } catch {
    // Authentication results must not depend on an observability sink.
  }
}

export async function loginPlatformOwner(
  input: unknown,
  deviceLabel: string | null,
  sourceKey: string,
  dependencies: OwnerLoginDependencies,
): Promise<OwnerLoginResult> {
  const credentials = parseOwnerLoginInput(input);
  const rateLimit = await dependencies.rateLimiter.consume(
    credentials.email,
    sourceKey,
    (dependencies.clock ?? Date.now)(),
  );
  if (rateLimit.status === "throttled") {
    await auditSafely(dependencies.securityAudit, "auth.login.throttled", {
      outcome: "throttled",
    });
    return rateLimit;
  }

  const authentication =
    await dependencies.authProvider.authenticate(credentials);

  if (authentication.status !== "authenticated") {
    await auditSafely(
      dependencies.securityAudit,
      authentication.status === "rejected"
        ? "auth.login.failed"
        : "auth.login.unavailable",
      { outcome: authentication.status },
    );
    return authentication;
  }

  const authorization = await authorizePlatformOwner({
    identity: authentication.identity,
    roleRepository: dependencies.roleRepository,
    assurancePolicy: dependencies.assurancePolicy,
  });

  if (authorization.status !== "authorized") {
    const terminated = await terminateSafely(dependencies.authProvider);
    await auditSafely(
      dependencies.securityAudit,
      authorization.status === "unavailable"
        ? "auth.login.unavailable"
        : "auth.authorization.denied",
      {
        outcome:
          authorization.status === "unavailable" ? "unavailable" : "rejected",
        actorId: authentication.identity.id,
      },
    );
    if (!terminated || authorization.status === "unavailable") {
      return { status: "unavailable" };
    }
    return { status: "rejected" };
  }

  try {
    const credential = await (
      dependencies.createCredential ?? createOpaqueSessionCredential
    )();
    const sessionId = await dependencies.sessionRepository.create(
      credential.tokenHash,
      normalizeDeviceLabel(deviceLabel),
    );
    await dependencies.rateLimiter.resetAccount(credentials.email);
    await auditSafely(dependencies.securityAudit, "auth.login.succeeded", {
      outcome: "authenticated",
      actorId: authentication.identity.id,
    });
    return {
      status: "authenticated",
      sessionId,
      sessionToken: credential.token,
    };
  } catch {
    await terminateSafely(dependencies.authProvider);
    await auditSafely(dependencies.securityAudit, "auth.login.unavailable", {
      outcome: "unavailable",
      actorId: authentication.identity.id,
    });
    return { status: "unavailable" };
  }
}
