"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  clearOwnerRecoveryGrantCookie,
  hashOwnerRecoveryIdentity,
  readOwnerRecoveryGrantCookie,
  setOwnerRecoveryBindingCookie,
} from "@/auth/owner-recovery-cookie";
import {
  consumeOwnerRecoveryGrant,
  parseOwnerRecoveryEmail,
  parseOwnerRecoveryPassword,
} from "@/auth/owner-password-recovery";
import { allowOwnerRecoveryRequest } from "@/auth/owner-recovery-rate-limit";
import { clearOwnerSessionCookie } from "@/auth/owner-session-cookie";
import { loadEnvironment } from "@/config/env";
import { formatMessage } from "@/messages/catalogue";
import { createRequestSupabaseClient } from "@/supabase/server";

export type RecoveryActionState = Readonly<{
  status: "idle" | "success" | "error";
  message?: string;
}>;

const genericRequestResult = (): RecoveryActionState => ({
  status: "success",
  message: formatMessage("auth.owner.recovery.request.result"),
});

export async function requestOwnerPasswordRecoveryAction(
  _state: RecoveryActionState,
  formData: FormData,
): Promise<RecoveryActionState> {
  const email = parseOwnerRecoveryEmail(formData.get("email"));
  if (!email) return genericRequestResult();
  try {
    const environment = loadEnvironment(process.env);
    if (environment.APP_ENV !== "local" && environment.APP_ENV !== "test")
      return genericRequestResult();
    const requestHeaders = await headers();
    const source = (
      requestHeaders.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ||
      requestHeaders.get("x-real-ip") ||
      "unknown-source"
    ).slice(0, 256);
    if (!allowOwnerRecoveryRequest(email, source))
      return genericRequestResult();
    const client = await createRequestSupabaseClient();
    const result = await client.auth.resetPasswordForEmail(email, {
      redirectTo: new URL("/auth/recover", environment.APP_BASE_URL).toString(),
    });
    if (!result.error) {
      setOwnerRecoveryBindingCookie(
        await cookies(),
        hashOwnerRecoveryIdentity(email),
        environment.APP_ENV,
      );
    }
  } catch {
    // Equivalent response prevents account and provider-state disclosure.
  }
  return genericRequestResult();
}

export async function completeOwnerPasswordRecoveryAction(
  _state: RecoveryActionState,
  formData: FormData,
): Promise<RecoveryActionState> {
  const password = parseOwnerRecoveryPassword(
    formData.get("password"),
    formData.get("confirmation"),
  );
  if (!password) {
    return {
      status: "error",
      message: formatMessage("auth.owner.recovery.password.invalid"),
    };
  }

  try {
    const environment = loadEnvironment(process.env);
    if (environment.APP_ENV !== "local" && environment.APP_ENV !== "test")
      throw new Error("Recovery unavailable");
    const store = await cookies();
    const grant = readOwnerRecoveryGrantCookie(store, environment.APP_ENV);
    const client = await createRequestSupabaseClient();
    const identity = await client.auth.getUser();
    const userId = identity.data.user?.id;
    if (
      identity.error ||
      !userId ||
      !grant ||
      !(await consumeOwnerRecoveryGrant(grant, userId))
    ) {
      throw new Error("Recovery grant unavailable");
    }
    const revoked = await client.rpc(
      "revoke_current_owner_sessions_for_recovery",
    );
    if (revoked.error || typeof revoked.data !== "number")
      throw new Error("Recovery revocation failed");
    const updated = await client.auth.updateUser({ password });
    if (updated.error) throw new Error("Password update failed");
    await client.auth.signOut({ scope: "global" });
    clearOwnerSessionCookie(store, environment.APP_ENV);
    clearOwnerRecoveryGrantCookie(store, environment.APP_ENV);
  } catch {
    return {
      status: "error",
      message: formatMessage("error.unexpected.message"),
    };
  }
  redirect("/login?status=recovery-complete");
}
