"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logoutMerchant } from "@/auth/merchant-logout-service";
import {
  clearMerchantSessionCookie,
  readMerchantSessionCookie,
} from "@/auth/merchant-session-cookie";
import { createSupabaseOwnerAuthProvider } from "@/auth/supabase-owner-auth-provider";
import { createSupabaseMerchantSessionRepository } from "@/auth/supabase-merchant-session-repository";
import { verifyRequestMerchantAccess } from "@/auth/merchant-request-access";
import { hashSessionToken } from "@/auth/session-token";
import { loadEnvironment } from "@/config/env";
import { formatMessage } from "@/messages/catalogue";
import { parseMerchantSettingsUpdate } from "@/merchant-settings/merchant-settings";
import { createSupabaseMerchantSettingsRepository } from "@/merchant-settings/supabase-merchant-settings-repository";
import { createRequestSupabaseClient } from "@/supabase/server";

export async function merchantLogoutAction(): Promise<void> {
  const environment = loadEnvironment(process.env);
  const store = await cookies();
  const token = readMerchantSessionCookie(store, environment.APP_ENV);
  try {
    const client = await createRequestSupabaseClient();
    await logoutMerchant(token, {
      authProvider: createSupabaseOwnerAuthProvider(client),
      sessionRepository: createSupabaseMerchantSessionRepository(client),
    });
  } finally {
    clearMerchantSessionCookie(store, environment.APP_ENV);
  }
  redirect("/merchant/login");
}

export type MerchantSettingsActionState = Readonly<{
  status: "idle" | "success" | "error";
  message?: string;
}>;

export async function updateMerchantSettingsAction(
  _previousState: MerchantSettingsActionState,
  formData: FormData,
): Promise<MerchantSettingsActionState> {
  if (!(await verifyRequestMerchantAccess())) redirect("/merchant/login");
  const environment = loadEnvironment(process.env);
  const token = readMerchantSessionCookie(await cookies(), environment.APP_ENV);
  const sessionTokenHash = await hashSessionToken(token);
  if (!sessionTokenHash) redirect("/merchant/login");
  try {
    const input = parseMerchantSettingsUpdate({
      businessName: formData.get("businessName"),
      contactEmail: formData.get("contactEmail"),
      contactPhone: formData.get("contactPhone"),
      currencyCode: formData.get("currencyCode"),
      timezone: formData.get("timezone"),
      version: Number(formData.get("version")),
    });
    await createSupabaseMerchantSettingsRepository(
      await createRequestSupabaseClient(),
    ).update(input, sessionTokenHash);
    revalidatePath("/merchant");
    return {
      status: "success",
      message: formatMessage("merchant.settings.update.success"),
    };
  } catch {
    return {
      status: "error",
      message: formatMessage("merchant.settings.update.failure"),
    };
  }
}
