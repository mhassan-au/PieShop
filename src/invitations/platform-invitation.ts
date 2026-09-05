import { z } from "zod";

const targetSchema = z.object({ businessId: z.uuid() }).strict();

export type InvitationTarget = z.infer<typeof targetSchema>;

export function parseInvitationTarget(input: unknown): InvitationTarget {
  return targetSchema.parse(input);
}
