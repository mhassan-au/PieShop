import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const OPERATION_ERROR = "Merchant session operation failed";
const rowSchema = z
  .object({
    business_id: z.uuid(),
    membership_role: z.literal("merchant_owner"),
    absolute_expires_at: z.iso.datetime({ offset: true }),
  })
  .strict();

type RpcClient = {
  rpc(
    name: string,
    parameters: Record<string, unknown>,
  ): Promise<{ data: unknown; error: unknown }>;
};

export class SupabaseMerchantSessionRepository {
  constructor(private readonly client: RpcClient) {}

  async verify(tokenHash: string) {
    const result = await this.client.rpc("verify_current_merchant_session", {
      p_session_token_hash: tokenHash,
    });
    if (result.error || !Array.isArray(result.data) || result.data.length !== 1)
      throw new Error(OPERATION_ERROR);
    try {
      const row = rowSchema.parse(result.data[0]);
      return {
        businessId: row.business_id,
        role: row.membership_role,
        absoluteExpiresAt: row.absolute_expires_at,
      } as const;
    } catch {
      throw new Error(OPERATION_ERROR);
    }
  }
}

export function createSupabaseMerchantSessionRepository(
  client: SupabaseClient,
) {
  return new SupabaseMerchantSessionRepository(client as unknown as RpcClient);
}
