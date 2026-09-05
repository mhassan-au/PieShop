import { z } from "zod";

const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);

const environmentSchema = z
  .object({
    APP_ENV: z.enum(["local", "test", "staging", "production"]),
    APP_BASE_URL: z.url(),
    LOG_LEVEL: z
      .enum(["debug", "info", "warn", "error", "fatal"])
      .default("info"),
    DEBUG_MODE: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    SENTRY_DSN: z.preprocess(blankToUndefined, z.url().optional()),
    NEXT_PUBLIC_SENTRY_DSN: z.preprocess(blankToUndefined, z.url().optional()),
    TELEGRAM_ALERT_BOT_TOKEN: z.preprocess(
      blankToUndefined,
      z.string().min(1).optional(),
    ),
    TELEGRAM_ALERT_CHAT_ID: z.preprocess(
      blankToUndefined,
      z.string().min(1).optional(),
    ),
    NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
      blankToUndefined,
      z.url().optional(),
    ),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.preprocess(
      blankToUndefined,
      z.string().startsWith("sb_publishable_").optional(),
    ),
    SUPABASE_DB_URL: z.preprocess(blankToUndefined, z.url().optional()),
    SUPABASE_SECRET_KEY: z.preprocess(
      blankToUndefined,
      z.string().startsWith("sb_secret_").optional(),
    ),
    SUPABASE_DESTRUCTIVE_CONFIRMATION: z.preprocess(
      blankToUndefined,
      z
        .string()
        .regex(/^[a-z0-9]{20}$/u)
        .optional(),
    ),
    MAILTRAP_SMTP_HOST: z.preprocess(
      blankToUndefined,
      z.literal("sandbox.smtp.mailtrap.io").optional(),
    ),
    MAILTRAP_SMTP_PORT: z.preprocess(
      blankToUndefined,
      z.coerce.number().int().positive().max(65535).optional(),
    ),
    MAILTRAP_SMTP_USERNAME: z.preprocess(
      blankToUndefined,
      z.string().min(1).optional(),
    ),
    MAILTRAP_SMTP_PASSWORD: z.preprocess(
      blankToUndefined,
      z.string().min(1).optional(),
    ),
    MAIL_FROM_EMAIL: z.preprocess(blankToUndefined, z.email().optional()),
    MAIL_FROM_NAME: z.preprocess(
      blankToUndefined,
      z.string().min(1).max(80).optional(),
    ),
  })
  .superRefine((value, context) => {
    const hasTelegramToken = Boolean(value.TELEGRAM_ALERT_BOT_TOKEN);
    const hasTelegramChat = Boolean(value.TELEGRAM_ALERT_CHAT_ID);
    if (hasTelegramToken !== hasTelegramChat) {
      context.addIssue({
        code: "custom",
        path: ["TELEGRAM_ALERT_CONFIGURATION"],
        message: "Telegram alert configuration must be complete",
      });
    }
    if (value.APP_ENV === "production" && value.DEBUG_MODE) {
      context.addIssue({
        code: "custom",
        path: ["DEBUG_MODE"],
        message: "Debug mode is unavailable in production",
      });
    }
    const hasSupabaseUrl = Boolean(value.NEXT_PUBLIC_SUPABASE_URL);
    const hasSupabaseKey = Boolean(value.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
    if (hasSupabaseUrl !== hasSupabaseKey) {
      context.addIssue({
        code: "custom",
        path: ["SUPABASE_PUBLIC_CONFIGURATION"],
        message: "Supabase public configuration must be complete",
      });
    }
    const mailValues = [
      value.MAILTRAP_SMTP_HOST,
      value.MAILTRAP_SMTP_PORT,
      value.MAILTRAP_SMTP_USERNAME,
      value.MAILTRAP_SMTP_PASSWORD,
      value.MAIL_FROM_EMAIL,
      value.MAIL_FROM_NAME,
    ];
    const configuredMailValues = mailValues.filter(Boolean).length;
    if (
      configuredMailValues !== 0 &&
      configuredMailValues !== mailValues.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["MAILTRAP_SMTP_CONFIGURATION"],
        message: "Mailtrap SMTP configuration must be complete",
      });
    }
    if (
      configuredMailValues > 0 &&
      value.APP_ENV !== "local" &&
      value.APP_ENV !== "test"
    ) {
      context.addIssue({
        code: "custom",
        path: ["MAILTRAP_SMTP_CONFIGURATION"],
        message:
          "Mailtrap sandbox is restricted to local and test environments",
      });
    }
  });

export type ApplicationEnvironment = z.infer<typeof environmentSchema>;

export function parseEnvironment(
  input: Record<string, string | undefined>,
): ApplicationEnvironment {
  const result = environmentSchema.safeParse(input);

  if (!result.success) {
    const invalidFields = result.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");

    throw new Error(
      `Application configuration is invalid${invalidFields ? `: ${invalidFields}` : ""}`,
    );
  }

  return result.data;
}

export function loadEnvironment(
  input: Record<string, string | undefined>,
): ApplicationEnvironment {
  const inferredEnvironment =
    input.APP_ENV ?? (input.CI || input.VERCEL ? undefined : "local");
  const canUseLocalBaseUrl =
    inferredEnvironment === "local" || inferredEnvironment === "test";

  return parseEnvironment({
    APP_ENV: inferredEnvironment,
    APP_BASE_URL:
      input.APP_BASE_URL ??
      (canUseLocalBaseUrl ? "http://localhost:3000" : undefined),
    LOG_LEVEL: input.LOG_LEVEL,
    DEBUG_MODE: input.DEBUG_MODE,
    SENTRY_DSN: input.SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_DSN: input.NEXT_PUBLIC_SENTRY_DSN,
    TELEGRAM_ALERT_BOT_TOKEN: input.TELEGRAM_ALERT_BOT_TOKEN,
    TELEGRAM_ALERT_CHAT_ID: input.TELEGRAM_ALERT_CHAT_ID,
    NEXT_PUBLIC_SUPABASE_URL: input.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      input.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_DB_URL: input.SUPABASE_DB_URL,
    SUPABASE_SECRET_KEY: input.SUPABASE_SECRET_KEY,
    SUPABASE_DESTRUCTIVE_CONFIRMATION: input.SUPABASE_DESTRUCTIVE_CONFIRMATION,
    MAILTRAP_SMTP_HOST: input.MAILTRAP_SMTP_HOST,
    MAILTRAP_SMTP_PORT: input.MAILTRAP_SMTP_PORT,
    MAILTRAP_SMTP_USERNAME: input.MAILTRAP_SMTP_USERNAME,
    MAILTRAP_SMTP_PASSWORD: input.MAILTRAP_SMTP_PASSWORD,
    MAIL_FROM_EMAIL: input.MAIL_FROM_EMAIL,
    MAIL_FROM_NAME: input.MAIL_FROM_NAME,
  });
}
