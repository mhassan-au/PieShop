"use server";

import { cookies } from "next/headers";

import { setInvitationBindingCookie } from "@/auth/invitation-binding-cookie";
import { loadEnvironment } from "@/config/env";
import { readInvitationAuthTarget } from "@/invitations/invitation-auth-target";
import { hashInvitationToken } from "@/invitations/invitation-token";
import { formatMessage } from "@/messages/catalogue";
import { createSupabaseAdminClient } from "@/supabase/admin";
import { createRequestSupabaseClient } from "@/supabase/server";

export type MagicLinkActionState = Readonly<{
  status: "idle" | "success" | "error";
  message?: string;
}>;

export async function requestMerchantMagicLinkAction(
  _state: MagicLinkActionState,
  formData: FormData,
): Promise<MagicLinkActionState> {
  try {
    const token = formData.get("invitationToken");
    if (typeof token !== "string") throw new Error("Invitation unavailable");
    const tokenHash = hashInvitationToken(token);
    const environment = loadEnvironment(process.env);
    const email = await readInvitationAuthTarget(
      createSupabaseAdminClient(environment),
      tokenHash,
    );
    const client = await createRequestSupabaseClient();
    const result = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: new URL(
          "/auth/confirm",
          environment.APP_BASE_URL,
        ).toString(),
        shouldCreateUser: false,
      },
    });
    if (result.error) throw new Error("Magic link request failed");
    setInvitationBindingCookie(await cookies(), tokenHash, environment.APP_ENV);
    return {
      status: "success",
      message: formatMessage("merchant.invitation.magicLinkSent"),
    };
  } catch {
    return {
      status: "error",
      message: formatMessage("merchant.invitation.magicLinkFailure"),
    };
  }
}
