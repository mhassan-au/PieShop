"use server";

import { cookies, headers } from "next/headers";

import {
  hashMerchantLoginIdentity,
  setMerchantLoginBindingCookie,
} from "@/auth/merchant-login-binding-cookie";
import { parseMerchantLoginEmail } from "@/auth/merchant-login-input";
import { isApprovedMerchantMagicLinkTarget } from "@/auth/merchant-magic-link-target";
import { allowMerchantMagicLinkRequest } from "@/auth/merchant-magic-link-rate-limit";
import { loadEnvironment } from "@/config/env";
import { formatMessage } from "@/messages/catalogue";
import { createSupabaseAdminClient } from "@/supabase/admin";
import { createRequestSupabaseClient } from "@/supabase/server";

export type MerchantLoginActionState = Readonly<{
  status: "idle" | "success";
  message?: string;
}>;

const genericSuccess = (): MerchantLoginActionState => ({
  status: "success",
  message: formatMessage("auth.merchant.login.result"),
});

export async function requestReturningMerchantMagicLinkAction(
  _state: MerchantLoginActionState,
  formData: FormData,
): Promise<MerchantLoginActionState> {
  const email = parseMerchantLoginEmail(formData.get("email"));
  if (!email) return genericSuccess();

  try {
    const environment = loadEnvironment(process.env);
    const requestHeaders = await headers();
    const forwardedSource = requestHeaders
      .get("x-forwarded-for")
      ?.split(",", 1)[0]
      ?.trim();
    const source = (
      forwardedSource ||
      requestHeaders.get("x-real-ip") ||
      "unknown-source"
    ).slice(0, 256);
    if (!allowMerchantMagicLinkRequest(email, source)) return genericSuccess();
    const approved = await isApprovedMerchantMagicLinkTarget(
      createSupabaseAdminClient(environment),
      email,
    );
    if (!approved) return genericSuccess();

    const client = await createRequestSupabaseClient();
    const result = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: new URL(
          "/auth/merchant-confirm",
          environment.APP_BASE_URL,
        ).toString(),
        shouldCreateUser: false,
      },
    });
    if (!result.error) {
      setMerchantLoginBindingCookie(
        await cookies(),
        hashMerchantLoginIdentity(email),
        environment.APP_ENV,
      );
    }
  } catch {
    // Deliberately return the same response to prevent account enumeration.
  }
  return genericSuccess();
}
