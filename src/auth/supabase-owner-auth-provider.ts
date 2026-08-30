import type { SupabaseClient } from "@supabase/supabase-js";

import type { OwnerLoginInput } from "./login-input";
import type {
  OwnerAuthenticationResult,
  OwnerAuthProvider,
} from "./owner-auth-provider";

type PasswordSignInClient = {
  auth: {
    signInWithPassword(input: OwnerLoginInput): Promise<{
      data: {
        user: { id: string; email?: string | null } | null;
      };
      error: { status?: number } | null;
    }>;
  };
};

export class SupabaseOwnerAuthProvider implements OwnerAuthProvider {
  constructor(private readonly client: PasswordSignInClient) {}

  async authenticate(
    input: OwnerLoginInput,
  ): Promise<OwnerAuthenticationResult> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword(input);

      if (error) {
        return error.status === 400 || error.status === 401
          ? { status: "rejected" }
          : { status: "unavailable" };
      }

      if (!data.user?.id || !data.user.email) {
        return { status: "unavailable" };
      }

      return {
        status: "authenticated",
        identity: {
          id: data.user.id,
          email: data.user.email,
          assuranceLevel: "aal1",
        },
      };
    } catch {
      return { status: "unavailable" };
    }
  }
}

export function createSupabaseOwnerAuthProvider(
  client: SupabaseClient,
): SupabaseOwnerAuthProvider {
  return new SupabaseOwnerAuthProvider(client);
}
