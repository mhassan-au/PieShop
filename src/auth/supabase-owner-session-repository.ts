import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const SESSION_OPERATION_ERROR = "Owner session operation failed";

const sessionIdSchema = z.string().uuid().or(z.string().min(1));
const instantSchema = z.string().datetime({ offset: true });
const sessionRowSchema = z.object({
  id: sessionIdSchema,
  device_label: z.string().nullable(),
  created_at: instantSchema,
  last_activity_at: instantSchema,
  absolute_expires_at: instantSchema,
  idle_expires_at: instantSchema,
  revoked_at: instantSchema.nullable(),
  revoked_reason: z.string().nullable(),
});

type SessionRpcResult = Promise<{ data: unknown; error: unknown }>;

type SessionRpcClient = {
  rpc(name: string, parameters?: Record<string, unknown>): SessionRpcResult;
};

export type SafeOwnerSession = Readonly<{
  id: string;
  deviceLabel: string | null;
  createdAt: string;
  lastActivityAt: string;
  absoluteExpiresAt: string;
  idleExpiresAt: string;
  revokedAt: string | null;
  revokedReason: string | null;
}>;

export type OwnerSessionRevocationReason =
  "logout" | "owner_action" | "role_change" | "recovery" | "security_event";

function parseResult<T>(
  result: { data: unknown; error: unknown },
  schema: z.ZodType<T>,
): T {
  if (result.error) throw new Error(SESSION_OPERATION_ERROR);

  const parsed = schema.safeParse(result.data);
  if (!parsed.success) throw new Error(SESSION_OPERATION_ERROR);
  return parsed.data;
}

export class SupabaseOwnerSessionRepository {
  constructor(private readonly client: SessionRpcClient) {}

  async create(tokenHash: string, deviceLabel: string | null): Promise<string> {
    const result = await this.client.rpc("create_current_owner_session", {
      p_device_label: deviceLabel,
      p_token_hash: tokenHash,
    });
    return parseResult(result, sessionIdSchema);
  }

  async list(): Promise<SafeOwnerSession[]> {
    const result = await this.client.rpc(
      "list_current_user_application_sessions",
    );
    const rows = parseResult(result, z.array(sessionRowSchema));

    return rows.map((row) => ({
      id: row.id,
      deviceLabel: row.device_label,
      createdAt: row.created_at,
      lastActivityAt: row.last_activity_at,
      absoluteExpiresAt: row.absolute_expires_at,
      idleExpiresAt: row.idle_expires_at,
      revokedAt: row.revoked_at,
      revokedReason: row.revoked_reason,
    }));
  }

  async touch(tokenHash: string): Promise<boolean> {
    const result = await this.client.rpc("touch_current_owner_session", {
      p_token_hash: tokenHash,
    });
    return parseResult(result, z.boolean());
  }

  async revoke(
    sessionId: string,
    reason: OwnerSessionRevocationReason,
  ): Promise<boolean> {
    const result = await this.client.rpc("revoke_current_owner_session", {
      p_reason: reason,
      p_session_id: sessionId,
    });
    return parseResult(result, z.boolean());
  }
}

export function createSupabaseOwnerSessionRepository(
  client: SupabaseClient,
): SupabaseOwnerSessionRepository {
  return new SupabaseOwnerSessionRepository(
    client as unknown as SessionRpcClient,
  );
}
