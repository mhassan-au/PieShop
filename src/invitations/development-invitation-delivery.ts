import type { ApplicationEnvironment } from "@/config/env";

export function createDevelopmentInvitationPreview(
  environment: ApplicationEnvironment,
  token: string,
): string {
  if (environment.APP_ENV !== "local" && environment.APP_ENV !== "test") {
    throw new Error("Development invitation preview is unavailable");
  }
  const url = new URL(
    `/invite/${encodeURIComponent(token)}`,
    environment.APP_BASE_URL,
  );
  return url.toString();
}
