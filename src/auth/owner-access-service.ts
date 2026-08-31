import type { AuthenticatedOwnerIdentity } from "./owner-auth-provider";
import {
  authorizePlatformOwner,
  type CurrentPlatformRoleRepository,
  type OwnerAssurancePolicy,
} from "./platform-owner-policy";
import { hashSessionToken } from "./session-token";
import type { CurrentOwnerIdentityProvider } from "./supabase-current-owner-provider";

type OwnerSessionTouchRepository = {
  touch(tokenHash: string): Promise<boolean>;
};

type OwnerAccessDependencies = Readonly<{
  identityProvider: CurrentOwnerIdentityProvider;
  roleRepository: CurrentPlatformRoleRepository;
  sessionRepository: OwnerSessionTouchRepository;
  assurancePolicy: OwnerAssurancePolicy;
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

export async function verifyPlatformOwnerAccess(
  sessionToken: unknown,
  dependencies: OwnerAccessDependencies,
): Promise<OwnerAccessResult> {
  const tokenHash = await hashSessionToken(sessionToken);
  if (!tokenHash) {
    return { status: "denied", reason: "session_required" };
  }

  const currentIdentity =
    await dependencies.identityProvider.getCurrentIdentity();
  if (currentIdentity.status === "unauthenticated") {
    return { status: "denied", reason: "authentication_required" };
  }
  if (currentIdentity.status === "unavailable") {
    return { status: "unavailable" };
  }

  const authorization = await authorizePlatformOwner({
    identity: currentIdentity.identity,
    roleRepository: dependencies.roleRepository,
    assurancePolicy: dependencies.assurancePolicy,
  });
  if (authorization.status === "unavailable") {
    return { status: "unavailable" };
  }
  if (authorization.status === "denied") {
    return { status: "denied", reason: authorization.reason };
  }

  try {
    const sessionIsLive = await dependencies.sessionRepository.touch(tokenHash);
    if (!sessionIsLive) {
      return { status: "denied", reason: "session_invalid" };
    }
  } catch {
    return { status: "unavailable" };
  }

  return { status: "authorized", principal: authorization.principal };
}
