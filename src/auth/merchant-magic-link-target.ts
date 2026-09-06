import type { SupabaseClient } from "@supabase/supabase-js";

export async function isApprovedMerchantMagicLinkTarget(
  client: Pick<SupabaseClient, "rpc">,
  email: string,
): Promise<boolean> {
  const result = await client.rpc("resolve_merchant_magic_link_target", {
    p_email: email,
  });
  if (result.error || typeof result.data !== "boolean") {
    throw new Error("Merchant authentication target unavailable");
  }
  return result.data;
}
