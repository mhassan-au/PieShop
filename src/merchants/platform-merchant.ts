import { z } from "zod";

const createMerchantSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    ownerEmail: z.string().trim().toLowerCase().email().max(254),
    timezone: z.string().trim().min(1).max(64),
    currencyCode: z.literal("AUD"),
  })
  .strict()
  .superRefine((value, context) => {
    try {
      new Intl.DateTimeFormat("en-AU", { timeZone: value.timezone }).format();
    } catch {
      context.addIssue({
        code: "custom",
        path: ["timezone"],
        message: "Timezone is invalid",
      });
    }
  });

const merchantRowSchema = z
  .object({
    id: z.uuid(),
    public_id: z.string().regex(/^biz_[a-zA-Z0-9]{8,32}$/u),
    name: z.string().min(1).max(120),
    status: z.enum(["onboarding", "active", "suspended", "archived"]),
    timezone: z.string().min(1).max(64),
    currency_code: z.literal("AUD"),
    invitation_status: z.enum(["draft", "issued", "used", "revoked"]),
    created_at: z.iso.datetime({ offset: true }),
    updated_at: z.iso.datetime({ offset: true }),
  })
  .strict();

export type CreateMerchantInput = z.infer<typeof createMerchantSchema>;
export type PlatformMerchant = ReturnType<typeof parsePlatformMerchant>;

export function parseCreateMerchantInput(input: unknown): CreateMerchantInput {
  return createMerchantSchema.parse(input);
}

export function parsePlatformMerchant(input: unknown) {
  const row = merchantRowSchema.parse(input);
  return {
    id: row.id,
    publicId: row.public_id,
    name: row.name,
    status: row.status,
    timezone: row.timezone,
    currencyCode: row.currency_code,
    invitationStatus: row.invitation_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as const;
}
