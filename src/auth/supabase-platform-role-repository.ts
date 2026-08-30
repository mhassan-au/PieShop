import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CurrentPlatformOwnerRole,
  CurrentPlatformRoleRepository,
} from "./platform-owner-policy";

type PlatformRoleQueryResult = {
  data: { is_active: boolean } | null;
  error: unknown;
};

type PlatformRoleQueryClient = {
  from(table: "platform_roles"): {
    select(columns: "is_active"): {
      eq(
        column: "role",
        value: "platform_owner",
      ): {
        maybeSingle(): Promise<PlatformRoleQueryResult>;
      };
    };
  };
};

export class SupabasePlatformRoleRepository implements CurrentPlatformRoleRepository {
  constructor(private readonly client: PlatformRoleQueryClient) {}

  async getCurrentPlatformOwnerRole(): Promise<CurrentPlatformOwnerRole> {
    const { data, error } = await this.client
      .from("platform_roles")
      .select("is_active")
      .eq("role", "platform_owner")
      .maybeSingle();

    if (error) {
      throw new Error("Platform role lookup failed");
    }

    if (!data) {
      return "missing";
    }

    return data.is_active ? "active" : "inactive";
  }
}

export function createSupabasePlatformRoleRepository(
  client: SupabaseClient,
): SupabasePlatformRoleRepository {
  return new SupabasePlatformRoleRepository(
    client as unknown as PlatformRoleQueryClient,
  );
}
