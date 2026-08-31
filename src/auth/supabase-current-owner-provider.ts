import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuthenticatedOwnerIdentity } from "./owner-auth-provider";

export type CurrentOwnerIdentityResult =
  | Readonly<{
      status: "authenticated";
      identity: AuthenticatedOwnerIdentity;
    }>
  | Readonly<{ status: "unauthenticated" }>
  | Readonly<{ status: "unavailable" }>;

export interface CurrentOwnerIdentityProvider {
  getCurrentIdentity(): Promise<CurrentOwnerIdentityResult>;
}

type CurrentUserClient = {
  auth: {
    getUser(): Promise<{
      data: { user: { id: string; email?: string | null } | null };
      error: { status?: number } | null;
    }>;
    mfa: {
      getAuthenticatorAssuranceLevel(): Promise<{
        data: { currentLevel: "aal1" | "aal2" | null } | null;
        error: unknown;
      }>;
    };
  };
};

export class SupabaseCurrentOwnerProvider implements CurrentOwnerIdentityProvider {
  constructor(private readonly client: CurrentUserClient) {}

  async getCurrentIdentity(): Promise<CurrentOwnerIdentityResult> {
    try {
      const { data: userData, error: userError } =
        await this.client.auth.getUser();

      if (userError) {
        return userError.status === 401 || userError.status === 403
          ? { status: "unauthenticated" }
          : { status: "unavailable" };
      }

      if (!userData.user?.id || !userData.user.email) {
        return { status: "unauthenticated" };
      }

      const { data: assuranceData, error: assuranceError } =
        await this.client.auth.mfa.getAuthenticatorAssuranceLevel();
      const assuranceLevel = assuranceData?.currentLevel;

      if (
        assuranceError ||
        (assuranceLevel !== "aal1" && assuranceLevel !== "aal2")
      ) {
        return { status: "unavailable" };
      }

      return {
        status: "authenticated",
        identity: {
          id: userData.user.id,
          email: userData.user.email,
          assuranceLevel,
        },
      };
    } catch {
      return { status: "unavailable" };
    }
  }
}

export function createSupabaseCurrentOwnerProvider(
  client: SupabaseClient,
): SupabaseCurrentOwnerProvider {
  return new SupabaseCurrentOwnerProvider(
    client as unknown as CurrentUserClient,
  );
}
