import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import {
  clearInvitationBindingCookie,
  readInvitationBindingCookie,
} from "@/auth/invitation-binding-cookie";
import { setMerchantSessionCookie } from "@/auth/merchant-session-cookie";
import { createOpaqueSessionCredential } from "@/auth/session-token";
import { loadEnvironment } from "@/config/env";
import { createSupabasePlatformInvitationRepository } from "@/invitations/supabase-platform-invitation-repository";
import { createRequestSupabaseClient } from "@/supabase/server";

export async function GET(request: NextRequest) {
  const environment = loadEnvironment(process.env);
  const store = await cookies();
  const invitationHash = readInvitationBindingCookie(
    store,
    environment.APP_ENV,
  );
  const code = request.nextUrl.searchParams.get("code");
  const errorUrl = new URL("/login", environment.APP_BASE_URL);
  errorUrl.searchParams.set("status", "invitation-unavailable");

  if (!code || !invitationHash) return NextResponse.redirect(errorUrl);

  try {
    const client = await createRequestSupabaseClient();
    const exchange = await client.auth.exchangeCodeForSession(code);
    if (exchange.error) throw new Error("Authentication confirmation failed");
    const credential = await createOpaqueSessionCredential();
    await createSupabasePlatformInvitationRepository(client).redeem(
      invitationHash,
      credential.tokenHash,
    );
    setMerchantSessionCookie(store, credential.token, environment.APP_ENV);
    clearInvitationBindingCookie(store, environment.APP_ENV);
    return NextResponse.redirect(
      new URL("/merchant", environment.APP_BASE_URL),
    );
  } catch {
    clearInvitationBindingCookie(store, environment.APP_ENV);
    return NextResponse.redirect(errorUrl);
  }
}
