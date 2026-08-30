import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedOwnerIdentity } from "./owner-auth-provider";
import {
  authorizePlatformOwner,
  INTERNAL_OWNER_ASSURANCE_POLICY,
  RELEASE_OWNER_ASSURANCE_POLICY,
  type CurrentPlatformRoleRepository,
} from "./platform-owner-policy";

const aal1Identity: AuthenticatedOwnerIdentity = {
  id: "auth-user-1",
  email: "owner@example.test",
  assuranceLevel: "aal1",
};

describe("authorizePlatformOwner", () => {
  it("authorizes an active current-user platform owner in private development", async () => {
    const getCurrentPlatformOwnerRole = vi
      .fn<CurrentPlatformRoleRepository["getCurrentPlatformOwnerRole"]>()
      .mockResolvedValue("active");

    const result = await authorizePlatformOwner({
      identity: aal1Identity,
      roleRepository: { getCurrentPlatformOwnerRole },
      assurancePolicy: INTERNAL_OWNER_ASSURANCE_POLICY,
    });

    expect(result).toEqual({ status: "authorized", principal: aal1Identity });
    expect(getCurrentPlatformOwnerRole).toHaveBeenCalledOnce();
    expect(getCurrentPlatformOwnerRole).toHaveBeenCalledWith();
  });

  it.each(["missing", "inactive"] as const)(
    "denies a current user whose platform-owner role is %s",
    async (roleStatus) => {
      const result = await authorizePlatformOwner({
        identity: aal1Identity,
        roleRepository: {
          getCurrentPlatformOwnerRole: vi.fn().mockResolvedValue(roleStatus),
        },
        assurancePolicy: INTERNAL_OWNER_ASSURANCE_POLICY,
      });

      expect(result).toEqual({ status: "denied", reason: "role_required" });
    },
  );

  it("checks the authoritative role again for every authorization", async () => {
    const getCurrentPlatformOwnerRole = vi
      .fn<CurrentPlatformRoleRepository["getCurrentPlatformOwnerRole"]>()
      .mockResolvedValueOnce("active")
      .mockResolvedValueOnce("inactive");
    const input = {
      identity: aal1Identity,
      roleRepository: { getCurrentPlatformOwnerRole },
      assurancePolicy: INTERNAL_OWNER_ASSURANCE_POLICY,
    };

    await expect(authorizePlatformOwner(input)).resolves.toEqual({
      status: "authorized",
      principal: aal1Identity,
    });
    await expect(authorizePlatformOwner(input)).resolves.toEqual({
      status: "denied",
      reason: "role_required",
    });
  });

  it("fails closed when the role repository is unavailable", async () => {
    await expect(
      authorizePlatformOwner({
        identity: aal1Identity,
        roleRepository: {
          getCurrentPlatformOwnerRole: vi
            .fn()
            .mockRejectedValue(new Error("database details")),
        },
        assurancePolicy: INTERNAL_OWNER_ASSURANCE_POLICY,
      }),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("preserves the release AAL2 gate", async () => {
    const roleRepository: CurrentPlatformRoleRepository = {
      getCurrentPlatformOwnerRole: vi.fn().mockResolvedValue("active"),
    };

    await expect(
      authorizePlatformOwner({
        identity: aal1Identity,
        roleRepository,
        assurancePolicy: RELEASE_OWNER_ASSURANCE_POLICY,
      }),
    ).resolves.toEqual({
      status: "denied",
      reason: "assurance_required",
    });

    await expect(
      authorizePlatformOwner({
        identity: { ...aal1Identity, assuranceLevel: "aal2" },
        roleRepository,
        assurancePolicy: RELEASE_OWNER_ASSURANCE_POLICY,
      }),
    ).resolves.toEqual({
      status: "authorized",
      principal: { ...aal1Identity, assuranceLevel: "aal2" },
    });
  });
});
