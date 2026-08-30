import { describe, expect, it, vi } from "vitest";

import { SupabasePlatformRoleRepository } from "./supabase-platform-role-repository";

function createClient(result: {
  data: { is_active: boolean } | null;
  error: unknown;
}) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });

  return {
    client: { from },
    from,
    select,
    eq,
    maybeSingle,
  };
}

describe("SupabasePlatformRoleRepository", () => {
  it.each([
    [{ is_active: true }, "active"],
    [{ is_active: false }, "inactive"],
    [null, "missing"],
  ] as const)("maps current-user role data to %s", async (data, expected) => {
    const query = createClient({ data, error: null });
    const repository = new SupabasePlatformRoleRepository(query.client);

    await expect(repository.getCurrentPlatformOwnerRole()).resolves.toBe(
      expected,
    );
    expect(query.from).toHaveBeenCalledWith("platform_roles");
    expect(query.select).toHaveBeenCalledWith("is_active");
    expect(query.eq).toHaveBeenCalledOnce();
    expect(query.eq).toHaveBeenCalledWith("role", "platform_owner");
    expect(query.maybeSingle).toHaveBeenCalledOnce();
  });

  it("fails closed without exposing a database error", async () => {
    const query = createClient({
      data: null,
      error: { message: "database secret", details: "internal address" },
    });
    const repository = new SupabasePlatformRoleRepository(query.client);

    const result = repository.getCurrentPlatformOwnerRole();

    await expect(result).rejects.toThrow("Platform role lookup failed");
    await expect(result).rejects.not.toThrow("database secret");
  });
});
