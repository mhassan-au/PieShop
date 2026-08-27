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
  input: NodeJS.ProcessEnv,
): ApplicationEnvironment {
  const isHostedEnvironment = Boolean(
    input.CI || input.VERCEL || input.APP_ENV,
  );

  return parseEnvironment({
    APP_ENV: input.APP_ENV ?? (isHostedEnvironment ? undefined : "local"),
    APP_BASE_URL:
      input.APP_BASE_URL ??
      (isHostedEnvironment ? undefined : "http://localhost:3000"),
    LOG_LEVEL: input.LOG_LEVEL,
    DEBUG_MODE: input.DEBUG_MODE,
    SENTRY_DSN: input.SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_DSN: input.NEXT_PUBLIC_SENTRY_DSN,
    TELEGRAM_ALERT_BOT_TOKEN: input.TELEGRAM_ALERT_BOT_TOKEN,
    TELEGRAM_ALERT_CHAT_ID: input.TELEGRAM_ALERT_CHAT_ID,
  });
}
