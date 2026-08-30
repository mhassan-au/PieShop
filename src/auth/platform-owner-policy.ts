import type { AuthenticatedOwnerIdentity } from "./owner-auth-provider";

export type CurrentPlatformOwnerRole = "active" | "inactive" | "missing";

export interface CurrentPlatformRoleRepository {
  getCurrentPlatformOwnerRole(): Promise<CurrentPlatformOwnerRole>;
}

export type OwnerAssurancePolicy = Readonly<{
  allows(assuranceLevel: AuthenticatedOwnerIdentity["assuranceLevel"]): boolean;
}>;

export const INTERNAL_OWNER_ASSURANCE_POLICY: OwnerAssurancePolicy = {
  allows: () => true,
};

export const RELEASE_OWNER_ASSURANCE_POLICY: OwnerAssurancePolicy = {
  allows: (assuranceLevel) => assuranceLevel === "aal2",
};

export type PlatformOwnerAuthorizationResult =
  | Readonly<{
      status: "authorized";
      principal: AuthenticatedOwnerIdentity;
    }>
  | Readonly<{
      status: "denied";
      reason: "role_required" | "assurance_required";
    }>
  | Readonly<{ status: "unavailable" }>;

type AuthorizePlatformOwnerInput = Readonly<{
  identity: AuthenticatedOwnerIdentity;
  roleRepository: CurrentPlatformRoleRepository;
  assurancePolicy: OwnerAssurancePolicy;
}>;

export async function authorizePlatformOwner({
  identity,
  roleRepository,
  assurancePolicy,
}: AuthorizePlatformOwnerInput): Promise<PlatformOwnerAuthorizationResult> {
  if (!assurancePolicy.allows(identity.assuranceLevel)) {
    return { status: "denied", reason: "assurance_required" };
  }

  try {
    const role = await roleRepository.getCurrentPlatformOwnerRole();

    if (role !== "active") {
      return { status: "denied", reason: "role_required" };
    }

    return { status: "authorized", principal: identity };
  } catch {
    return { status: "unavailable" };
  }
}
