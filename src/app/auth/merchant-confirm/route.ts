import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import {
  clearMerchantLoginBindingCookie,
  hashMerchantLoginIdentity,
  readMerchantLoginBindingCookie,
} from "@/auth/merchant-login-binding-cookie";
import { setMerchantSessionCookie } from "@/auth/merchant-session-cookie";
import { createOpaqueSessionCredential } from "@/auth/session-token";
import { createSupabaseMerchantSessionRepository } from "@/auth/supabase-merchant-session-repository";
import { loadEnvironment } from "@/config/env";
import { ConsoleLogSink, createLogger } from "@/observability/logger";
import { createRequestSupabaseClient } from "@/supabase/server";

export async function GET(request: NextRequest) {
  const environment = loadEnvironment(process.env);
  const logger = createLogger({
    environment: environment.APP_ENV,
    service: "web",
    minimumLevel: environment.LOG_LEVEL,
    debugMode: environment.DEBUG_MODE,
    sink: new ConsoleLogSink(),
  });
  const store = await cookies();
  const binding = readMerchantLoginBindingCookie(store, environment.APP_ENV);
  const code = request.nextUrl.searchParams.get("code");
  const failure = new URL("/merchant/login", environment.APP_BASE_URL);
  failure.searchParams.set("status", "unavailable");
  if (!code || !binding) {
    await logger.warn("auth.merchant_returning_confirmation.failed", {
      outcome: "rejected",
      errorCode: !code ? "CODE_MISSING" : "BINDING_MISSING",
      securityRelevant: true,
    });
    return NextResponse.redirect(failure);
  }

  const client = await createRequestSupabaseClient();
  let stage = "code_exchange";
  try {
    const exchange = await client.auth.exchangeCodeForSession(code);
    if (exchange.error) throw new Error("Authentication confirmation failed");
    stage = "identity_binding";
    const identity = await client.auth.getUser();
    const email = identity.data.user?.email;
    if (
      identity.error ||
      !email ||
      hashMerchantLoginIdentity(email) !== binding
    ) {
      throw new Error("Authentication binding mismatch");
    }
    stage = "session_creation";
    const credential = await createOpaqueSessionCredential();
    await createSupabaseMerchantSessionRepository(client).startCurrent(
      credential.tokenHash,
    );
    setMerchantSessionCookie(store, credential.token, environment.APP_ENV);
    clearMerchantLoginBindingCookie(store, environment.APP_ENV);
    return NextResponse.redirect(
      new URL("/merchant", environment.APP_BASE_URL),
    );
  } catch {
    await logger.warn("auth.merchant_returning_confirmation.failed", {
      outcome: "rejected",
      errorCode: stage.toUpperCase(),
      securityRelevant: true,
    });
    await client.auth.signOut({ scope: "local" });
    clearMerchantLoginBindingCookie(store, environment.APP_ENV);
    return NextResponse.redirect(failure);
  }
}
