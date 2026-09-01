import type { AuthenticatedOwnerIdentity } from "./owner-auth-provider";
import {
  authorizePlatformOwner,
  type CurrentPlatformRoleRepository,
  type OwnerAssurancePolicy,
} from "./platform-owner-policy";
import { hashSessionToken } from "./session-token";
import type { CurrentOwnerIdentityProvider } from "./supabase-current-owner-provider";
import type {
  OwnerSecurityAudit,
  OwnerSecurityEvent,
} from "./owner-security-audit";

type OwnerSessionTouchRepository = {
  touch(tokenHash: string): Promise<boolean>;
};

type OwnerAccessDependencies = Readonly<{
  identityProvider: CurrentOwnerIdentityProvider;
  roleRepository: CurrentPlatformRoleRepository;
  sessionRepository: OwnerSessionTouchRepository;
  assurancePolicy: OwnerAssurancePolicy;
  securityAudit: OwnerSecurityAudit;
}>;

export type OwnerAccessResult =
  | Readonly<{
      status: "authorized";
      principal: AuthenticatedOwnerIdentity;
    }>
  | Readonly<{
      status: "denied";
      reason:
        | "session_required"
        | "authentication_required"
        | "role_required"
        | "assurance_required"
        | "session_invalid";
    }>
  | Readonly<{ status: "unavailable" }>;

async function auditSafely(
  audit: OwnerSecurityAudit,
  event: OwnerSecurityEvent,
  input: Readonly<{ outcome: string; actorId?: string }>,
): Promise<void> {
  try {
    await audit.record(event, input);
  } catch {
    // Authorization results must not depend on an observability sink.
  }
}

export async function verifyPlatformOwnerAccess(
  sessionToken: unknown,
  dependencies: OwnerAccessDependencies,
): Promise<OwnerAccessResult> {
  const tokenHash = await hashSessionToken(sessionToken);
  if (!tokenHash) {
    await auditSafely(dependencies.securityAudit, "auth.session.denied", {
      outcome: "session_required",
    });
    return { status: "denied", reason: "session_required" };
  }

  const currentIdentity =
    await dependencies.identityProvider.getCurrentIdentity();
  if (currentIdentity.status === "unauthenticated") {
    await auditSafely(dependencies.securityAudit, "auth.session.denied", {
      outcome: "authentication_required",
    });
    return { status: "denied", reason: "authentication_required" };
  }
  if (currentIdentity.status === "unavailable") {
    await auditSafely(dependencies.securityAudit, "auth.access.unavailable", {
      outcome: "identity_unavailable",
    });
    return { status: "unavailable" };
  }

  const authorization = await authorizePlatformOwner({
    identity: currentIdentity.identity,
    roleRepository: dependencies.roleRepository,
    assurancePolicy: dependencies.assurancePolicy,
  });
  if (authorization.status === "unavailable") {
    await auditSafely(dependencies.securityAudit, "auth.access.unavailable", {
      outcome: "role_unavailable",
      actorId: currentIdentity.identity.id,
    });
    return { status: "unavailable" };
  }
  if (authorization.status === "denied") {
    await auditSafely(dependencies.securityAudit, "auth.authorization.denied", {
      outcome: authorization.reason,
      actorId: currentIdentity.identity.id,
    });
    return { status: "denied", reason: authorization.reason };
  }

  try {
    const sessionIsLive = await dependencies.sessionRepository.touch(tokenHash);
    if (!sessionIsLive) {
      await auditSafely(dependencies.securityAudit, "auth.session.denied", {
        outcome: "session_invalid",
        actorId: currentIdentity.identity.id,
      });
      return { status: "denied", reason: "session_invalid" };
    }
  } catch {
    await auditSafely(dependencies.securityAudit, "auth.access.unavailable", {
      outcome: "session_unavailable",
      actorId: currentIdentity.identity.id,
    });
    return { status: "unavailable" };
  }

  return { status: "authorized", principal: authorization.principal };
}
