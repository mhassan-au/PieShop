"use server";

import { randomUUID } from "node:crypto";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { loginPlatformOwner } from "@/auth/owner-login-service";
import { processLocalOwnerLoginRateLimiter } from "@/auth/owner-login-rate-limit";
import { createOwnerSecurityAudit } from "@/auth/owner-security-audit";
import { setOwnerSessionCookie } from "@/auth/owner-session-cookie";
import {
  INTERNAL_OWNER_ASSURANCE_POLICY,
  RELEASE_OWNER_ASSURANCE_POLICY,
} from "@/auth/platform-owner-policy";
import { createSupabaseOwnerAuthProvider } from "@/auth/supabase-owner-auth-provider";
import { createSupabaseOwnerSessionRepository } from "@/auth/supabase-owner-session-repository";
import { createSupabasePlatformRoleRepository } from "@/auth/supabase-platform-role-repository";
import { loadEnvironment } from "@/config/env";
import { createPublicErrorEnvelope } from "@/errors/app-error";
import { formatMessage } from "@/messages/catalogue";
import { ConsoleLogSink, createLogger } from "@/observability/logger";
import { createRequestSupabaseClient } from "@/supabase/server";

export type OwnerLoginActionState = Readonly<{
  status: "idle" | "authenticated" | "error";
  message?: string;
}>;

export async function ownerLoginAction(
  _previousState: OwnerLoginActionState,
  formData: FormData,
): Promise<OwnerLoginActionState> {
  try {
    const environment = loadEnvironment(process.env);
    const client = await createRequestSupabaseClient();
    const authProvider = createSupabaseOwnerAuthProvider(client);
    const sessionRepository = createSupabaseOwnerSessionRepository(client);
    const requestHeaders = await headers();
    const securityAudit = createOwnerSecurityAudit(
      createLogger({
        environment: environment.APP_ENV,
        service: "web",
        minimumLevel: environment.LOG_LEVEL,
        debugMode: environment.DEBUG_MODE,
        sink: new ConsoleLogSink(),
      }),
      randomUUID(),
    );
    const forwardedSource = requestHeaders
      .get("x-forwarded-for")
      ?.split(",", 1)[0]
      ?.trim();
    const result = await loginPlatformOwner(
      {
        email: formData.get("email"),
        password: formData.get("password"),
      },
      requestHeaders.get("user-agent"),
      (
        forwardedSource ||
        requestHeaders.get("x-real-ip") ||
        "unknown-source"
      ).slice(0, 256),
      {
        authProvider,
        roleRepository: createSupabasePlatformRoleRepository(client),
        sessionRepository,
        assurancePolicy:
          environment.APP_ENV === "local" || environment.APP_ENV === "test"
            ? INTERNAL_OWNER_ASSURANCE_POLICY
            : RELEASE_OWNER_ASSURANCE_POLICY,
        rateLimiter: processLocalOwnerLoginRateLimiter,
        securityAudit,
      },
    );

    if (result.status === "throttled") {
      return {
        status: "error",
        message: formatMessage("error.auth.throttled"),
      };
    }

    if (result.status === "rejected") {
      return {
        status: "error",
        message: formatMessage("error.auth.invalidCredentials"),
      };
    }

    if (result.status === "unavailable") {
      return {
        status: "error",
        message: formatMessage("error.unexpected.message"),
      };
    }

    try {
      setOwnerSessionCookie(
        await cookies(),
        result.sessionToken,
        environment.APP_ENV,
      );
    } catch {
      await Promise.allSettled([
        sessionRepository.revoke(result.sessionId, "security_event"),
        authProvider.terminateSession(),
      ]);
      return {
        status: "error",
        message: formatMessage("error.unexpected.message"),
      };
    }
  } catch (error) {
    return {
      status: "error",
      message: createPublicErrorEnvelope(error).body.error.message,
    };
  }

  redirect("/control");
}
