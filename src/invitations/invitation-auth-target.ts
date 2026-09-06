import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const rowSchema = z.object({ recipient_email: z.email() }).strict();

export async function readInvitationAuthTarget(
  client: SupabaseClient,
  tokenHash: string,
): Promise<string> {
  const result = await client.rpc("get_server_invitation_auth_target", {
    p_token_hash_hex: tokenHash,
  });
  if (result.error || !Array.isArray(result.data) || result.data.length !== 1)
    throw new Error("Invitation authentication unavailable");
  try {
    return rowSchema.parse(result.data[0]).recipient_email;
  } catch {
    throw new Error("Invitation authentication unavailable");
  }
}
