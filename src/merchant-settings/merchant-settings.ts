import { z } from "zod";

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/u;

function validTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en-AU", { timeZone: value }).format();
    return value === "Australia/Sydney";
  } catch {
    return false;
  }
}

const settingsUpdateSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .refine((value) => !CONTROL_CHARACTERS.test(value)),
    contactEmail: z.string().trim().toLowerCase().email().max(254),
    contactPhone: z
      .string()
      .transform((value) => value.replace(/[\s().-]/gu, ""))
      .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/u)),
    currencyCode: z.literal("AUD"),
    timezone: z.string().trim().min(1).max(64).refine(validTimezone),
    version: z.number().int().positive(),
  })
  .strict();

const settingsRowSchema = z
  .object({
    business_id: z.uuid(),
    business_name: z.string().min(1).max(120),
    contact_email: z.string().email().max(254).nullable(),
    contact_phone: z
      .string()
      .regex(/^\+[1-9]\d{7,14}$/u)
      .nullable(),
    currency_code: z.literal("AUD"),
    timezone: z.literal("Australia/Sydney"),
    version: z.number().int().positive(),
    updated_at: z.iso.datetime({ offset: true }),
  })
  .strict();

export type MerchantSettingsUpdate = z.infer<typeof settingsUpdateSchema>;

export function parseMerchantSettingsUpdate(
  input: unknown,
): MerchantSettingsUpdate {
  return settingsUpdateSchema.parse(input);
}

export function parseMerchantSettingsRow(input: unknown) {
  const row = settingsRowSchema.parse(input);
  return {
    businessId: row.business_id,
    businessName: row.business_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    currencyCode: row.currency_code,
    timezone: row.timezone,
    version: row.version,
    updatedAt: row.updated_at,
  } as const;
}

export function deriveSetupState(settings: {
  businessName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  currencyCode: string;
  timezone: string;
}) {
  const steps = {
    business: settings.businessName.trim().length > 0,
    currency: settings.currencyCode === "AUD",
    timezone: validTimezone(settings.timezone),
    contact: Boolean(settings.contactEmail && settings.contactPhone),
  };
  const completed = Object.values(steps).filter(Boolean).length;
  const next = (Object.entries(steps).find(([, done]) => !done)?.[0] ??
    "complete") as keyof typeof steps | "complete";
  return { completed, total: 4, percent: completed * 25, next } as const;
}
