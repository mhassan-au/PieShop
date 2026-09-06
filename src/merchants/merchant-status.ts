import { z } from "zod";

export const merchantStatusChangeSchema = z
  .object({
    businessId: z.uuid(),
    targetStatus: z.enum(["active", "suspended", "archived"]),
  })
  .strict();

export type MerchantStatusChange = z.infer<typeof merchantStatusChangeSchema>;

export function parseMerchantStatusChange(
  input: unknown,
): MerchantStatusChange {
  return merchantStatusChangeSchema.parse(input);
}

export function onboardingProgressFor(
  status: "onboarding" | "active" | "suspended" | "archived",
  invitationStatus: "draft" | "issued" | "used" | "revoked",
) {
  if (status === "active") return "active" as const;
  if (status === "suspended") return "suspended" as const;
  if (status === "archived") return "archived" as const;
  return invitationStatus === "used"
    ? ("ready_to_activate" as const)
    : ("invitation_pending" as const);
}
