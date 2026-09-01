import "server-only";

import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";

import { loadEnvironment } from "@/config/env";
import { createRequestSupabaseClient } from "@/supabase/server";
import { ConsoleLogSink, createLogger } from "@/observability/logger";

import { verifyPlatformOwnerAccess } from "./owner-access-service";
import { readOwnerSessionCookie } from "./owner-session-cookie";
import { createOwnerSecurityAudit } from "./owner-security-audit";
import {
  INTERNAL_OWNER_ASSURANCE_POLICY,
  RELEASE_OWNER_ASSURANCE_POLICY,
} from "./platform-owner-policy";
import { createSupabaseCurrentOwnerProvider } from "./supabase-current-owner-provider";
import { createSupabaseOwnerSessionRepository } from "./supabase-owner-session-repository";
import { createSupabasePlatformRoleRepository } from "./supabase-platform-role-repository";

export async function verifyRequestPlatformOwnerAccess() {
  const environment = loadEnvironment(process.env);
  const cookieStore = await cookies();
  const sessionToken = readOwnerSessionCookie(cookieStore, environment.APP_ENV);
  const client = await createRequestSupabaseClient();

  return verifyPlatformOwnerAccess(sessionToken, {
    identityProvider: createSupabaseCurrentOwnerProvider(client),
    roleRepository: createSupabasePlatformRoleRepository(client),
    sessionRepository: createSupabaseOwnerSessionRepository(client),
    assurancePolicy:
      environment.APP_ENV === "local" || environment.APP_ENV === "test"
        ? INTERNAL_OWNER_ASSURANCE_POLICY
        : RELEASE_OWNER_ASSURANCE_POLICY,
    securityAudit: createOwnerSecurityAudit(
      createLogger({
        environment: environment.APP_ENV,
        service: "web",
        minimumLevel: environment.LOG_LEVEL,
        debugMode: environment.DEBUG_MODE,
        sink: new ConsoleLogSink(),
      }),
      randomUUID(),
    ),
  });
}
