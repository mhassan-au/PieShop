import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const TARGET_ERROR = "Invitation delivery target unavailable";

const targetRowSchema = z
  .object({
    recipient_email: z.email(),
    business_name: z.string().min(1).max(120),
  })
  .strict();

export type InvitationDeliveryTarget = Readonly<{
  recipientEmail: string;
  businessName: string;
}>;

export async function readInvitationDeliveryTarget(
  client: SupabaseClient,
  businessId: string,
): Promise<InvitationDeliveryTarget> {
  const result = await client.rpc("get_server_invitation_delivery_target", {
    p_business_id: businessId,
  });

  if (result.error || !Array.isArray(result.data) || result.data.length !== 1) {
    throw new Error(TARGET_ERROR);
  }
  try {
    const row = targetRowSchema.parse(result.data[0]);
    return {
      recipientEmail: row.recipient_email,
      businessName: row.business_name,
    };
  } catch {
    throw new Error(TARGET_ERROR);
  }
}
