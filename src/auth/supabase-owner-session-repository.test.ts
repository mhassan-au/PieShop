import { describe, expect, it, vi } from "vitest";

import { SupabaseOwnerSessionRepository } from "./supabase-owner-session-repository";

function createClient(
  results: Record<string, { data: unknown; error: unknown }>,
) {
  const rpc = vi.fn(async (name: string, parameters?: unknown) => {
    void parameters;
    const result = results[name];
    if (!result) throw new Error(`Unexpected RPC: ${name}`);
    return result;
  });

  return { client: { rpc }, rpc };
}

describe("SupabaseOwnerSessionRepository", () => {
  it("creates a self-bound session using only its hash and safe device label", async () => {
    const { client, rpc } = createClient({
      create_current_owner_session: { data: "session-1", error: null },
    });
    const repository = new SupabaseOwnerSessionRepository(client);

    await expect(
      repository.create("a".repeat(64), "Firefox on Windows"),
    ).resolves.toBe("session-1");
    expect(rpc).toHaveBeenCalledWith("create_current_owner_session", {
      p_device_label: "Firefox on Windows",
      p_token_hash: "a".repeat(64),
    });
  });

  it("returns safe session metadata without credential hashes", async () => {
    const { client } = createClient({
      list_current_user_application_sessions: {
        data: [
          {
            id: "session-1",
            device_label: null,
            created_at: "2026-08-30T00:00:00.000Z",
            last_activity_at: "2026-08-30T00:30:00.000Z",
            absolute_expires_at: "2026-08-30T12:00:00.000Z",
            idle_expires_at: "2026-08-30T02:30:00.000Z",
            revoked_at: null,
            revoked_reason: null,
            is_current: true,
          },
        ],
        error: null,
      },
    });
    const repository = new SupabaseOwnerSessionRepository(client);

    await expect(repository.list("d".repeat(64))).resolves.toEqual([
      {
        id: "session-1",
        deviceLabel: null,
        createdAt: "2026-08-30T00:00:00.000Z",
        lastActivityAt: "2026-08-30T00:30:00.000Z",
        absoluteExpiresAt: "2026-08-30T12:00:00.000Z",
        idleExpiresAt: "2026-08-30T02:30:00.000Z",
        revokedAt: null,
        revokedReason: null,
        isCurrent: true,
      },
    ]);
    expect(client.rpc).toHaveBeenCalledWith(
      "list_current_user_application_sessions",
      { p_current_token_hash: "d".repeat(64) },
    );
  });

  it("touches and revokes only through self-bound RPCs", async () => {
    const { client, rpc } = createClient({
      touch_current_owner_session: { data: true, error: null },
      revoke_current_owner_session: { data: true, error: null },
      revoke_current_owner_session_by_token: { data: true, error: null },
    });
    const repository = new SupabaseOwnerSessionRepository(client);

    await expect(repository.touch("b".repeat(64))).resolves.toBe(true);
    await expect(repository.revoke("session-2", "owner_action")).resolves.toBe(
      true,
    );
    await expect(
      repository.revokeCurrentByTokenHash("c".repeat(64)),
    ).resolves.toBe(true);
    expect(rpc).toHaveBeenNthCalledWith(1, "touch_current_owner_session", {
      p_token_hash: "b".repeat(64),
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "revoke_current_owner_session", {
      p_reason: "owner_action",
      p_session_id: "session-2",
    });
    expect(rpc).toHaveBeenNthCalledWith(
      3,
      "revoke_current_owner_session_by_token",
      { p_token_hash: "c".repeat(64) },
    );
  });

  it("fails closed without exposing provider error details", async () => {
    const { client } = createClient({
      create_current_owner_session: {
        data: null,
        error: { message: "credential hash duplicated: secret-value" },
      },
    });
    const repository = new SupabaseOwnerSessionRepository(client);

    await expect(repository.create("c".repeat(64), null)).rejects.toThrow(
      "Owner session operation failed",
    );
    await expect(repository.create("c".repeat(64), null)).rejects.not.toThrow(
      "secret-value",
    );
  });
});
