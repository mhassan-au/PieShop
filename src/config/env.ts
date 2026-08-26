import { z } from "zod";

const environmentSchema = z.object({
  APP_ENV: z.enum(["local", "test", "staging", "production"]),
  APP_BASE_URL: z.url(),
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
  });
}
