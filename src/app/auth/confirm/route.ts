import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import {
  clearInvitationBindingCookie,
  readInvitationBindingCookie,
} from "@/auth/invitation-binding-cookie";
import { setMerchantSessionCookie } from "@/auth/merchant-session-cookie";
import { createOpaqueSessionCredential } from "@/auth/session-token";
import { loadEnvironment } from "@/config/env";
import { readInvitationAuthTarget } from "@/invitations/invitation-auth-target";
import {
  createSupabasePlatformInvitationRepository,
  InvitationOperationError,
} from "@/invitations/supabase-platform-invitation-repository";
import { ConsoleLogSink, createLogger } from "@/observability/logger";
import { createSupabaseAdminClient } from "@/supabase/admin";
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
  const invitationHash = readInvitationBindingCookie(
    store,
    environment.APP_ENV,
  );
  const code = request.nextUrl.searchParams.get("code");
  const errorUrl = new URL("/login", environment.APP_BASE_URL);
  errorUrl.searchParams.set("status", "invitation-unavailable");

  if (!code || !invitationHash) {
    await logger.warn("auth.merchant_confirmation.failed", {
      outcome: "rejected",
      errorCode: !code ? "CODE_MISSING" : "BINDING_MISSING",
      securityRelevant: true,
    });
    return NextResponse.redirect(errorUrl);
  }

  let stage = "code_exchange";
  try {
    const client = await createRequestSupabaseClient();
    const exchange = await client.auth.exchangeCodeForSession(code);
    if (exchange.error) throw new Error("Authentication confirmation failed");
    stage = "identity_lookup";
    const [identity, invitedEmail] = await Promise.all([
      client.auth.getUser(),
      readInvitationAuthTarget(
        createSupabaseAdminClient(environment),
        invitationHash,
      ),
    ]);
    const authenticatedEmail = identity.data.user?.email?.trim().toLowerCase();
    if (identity.error || !authenticatedEmail) {
      throw new Error("Authenticated identity unavailable");
    }
    if (authenticatedEmail !== invitedEmail.trim().toLowerCase()) {
      stage = "email_mismatch";
      throw new Error("Invitation recipient mismatch");
    }
    stage = "redemption";
    const credential = await createOpaqueSessionCredential();
    await createSupabasePlatformInvitationRepository(client).redeem(
      invitationHash,
      credential.tokenHash,
    );
    stage = "session_cookie";
    setMerchantSessionCookie(store, credential.token, environment.APP_ENV);
    clearInvitationBindingCookie(store, environment.APP_ENV);
    return NextResponse.redirect(
      new URL("/merchant", environment.APP_BASE_URL),
    );
  } catch (error) {
    await logger.warn("auth.merchant_confirmation.failed", {
      outcome: "rejected",
      errorCode:
        error instanceof InvitationOperationError && error.providerCode
          ? `REDEEM_${error.providerCode}`
          : stage.toUpperCase(),
      securityRelevant: true,
    });
    clearInvitationBindingCookie(store, environment.APP_ENV);
    return NextResponse.redirect(errorUrl);
  }
}
