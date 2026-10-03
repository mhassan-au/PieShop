import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import {
  clearOwnerRecoveryBindingCookie,
  hashOwnerRecoveryIdentity,
  readOwnerRecoveryBindingCookie,
  setOwnerRecoveryGrantCookie,
} from "@/auth/owner-recovery-cookie";
import { issueOwnerRecoveryGrant } from "@/auth/owner-password-recovery";
import { createSupabasePlatformRoleRepository } from "@/auth/supabase-platform-role-repository";
import { loadEnvironment } from "@/config/env";
import { createRequestSupabaseClient } from "@/supabase/server";

export async function GET(request: NextRequest) {
  const environment = loadEnvironment(process.env);
  const store = await cookies();
  const binding = readOwnerRecoveryBindingCookie(store, environment.APP_ENV);
  const code = request.nextUrl.searchParams.get("code");
  const denied = new URL(
    "/recover?status=unavailable",
    environment.APP_BASE_URL,
  );
  if (!code || !binding) return NextResponse.redirect(denied);

  try {
    const client = await createRequestSupabaseClient();
    const exchange = await client.auth.exchangeCodeForSession(code);
    if (exchange.error) throw new Error("Recovery exchange failed");
    const identity = await client.auth.getUser();
    const user = identity.data.user;
    if (
      identity.error ||
      !user?.id ||
      !user.email ||
      hashOwnerRecoveryIdentity(user.email) !== binding
    ) {
      throw new Error("Recovery identity mismatch");
    }
    const role =
      await createSupabasePlatformRoleRepository(
        client,
      ).getCurrentPlatformOwnerRole();
    if (role !== "active") throw new Error("Recovery role unavailable");
    const grant = await issueOwnerRecoveryGrant(user.id);
    setOwnerRecoveryGrantCookie(store, grant, environment.APP_ENV);
    clearOwnerRecoveryBindingCookie(store, environment.APP_ENV);
    return NextResponse.redirect(
      new URL("/recover/reset", environment.APP_BASE_URL),
    );
  } catch {
    clearOwnerRecoveryBindingCookie(store, environment.APP_ENV);
    return NextResponse.redirect(denied);
  }
}
