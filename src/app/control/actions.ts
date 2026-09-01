"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logoutPlatformOwner } from "@/auth/owner-logout-service";
import { verifyRequestPlatformOwnerAccess } from "@/auth/owner-request-access";
import { parseOwnerSessionRevocationInput } from "@/auth/owner-session-input";
import {
  clearOwnerSessionCookie,
  readOwnerSessionCookie,
} from "@/auth/owner-session-cookie";
import { createSupabaseOwnerAuthProvider } from "@/auth/supabase-owner-auth-provider";
import { createSupabaseOwnerSessionRepository } from "@/auth/supabase-owner-session-repository";
import { loadEnvironment } from "@/config/env";
import { formatMessage } from "@/messages/catalogue";
import { parseCreateMerchantInput } from "@/merchants/platform-merchant";
import { createSupabasePlatformMerchantRepository } from "@/merchants/supabase-platform-merchant-repository";
import { createRequestSupabaseClient } from "@/supabase/server";

export async function ownerLogoutAction(): Promise<void> {
  const environment = loadEnvironment(process.env);
  const cookieStore = await cookies();
  const sessionToken = readOwnerSessionCookie(cookieStore, environment.APP_ENV);

  try {
    const client = await createRequestSupabaseClient();
    await logoutPlatformOwner(sessionToken, {
      authProvider: createSupabaseOwnerAuthProvider(client),
      sessionRepository: createSupabaseOwnerSessionRepository(client),
    });
  } finally {
    clearOwnerSessionCookie(cookieStore, environment.APP_ENV);
  }

  redirect("/login");
}

export async function revokeOwnerSessionAction(
  formData: FormData,
): Promise<void> {
  const access = await verifyRequestPlatformOwnerAccess();
  if (access.status === "denied") redirect("/login");
  if (access.status === "unavailable") {
    throw new Error("Owner access verification failed");
  }

  const input = parseOwnerSessionRevocationInput({
    sessionId: formData.get("sessionId"),
  });
  const client = await createRequestSupabaseClient();
  await createSupabaseOwnerSessionRepository(client).revoke(
    input.sessionId,
    "owner_action",
  );
  revalidatePath("/control");
}

export type CreateMerchantActionState = Readonly<{
  status: "idle" | "success" | "error";
  message?: string;
}>;

export async function createMerchantAction(
  _previousState: CreateMerchantActionState,
  formData: FormData,
): Promise<CreateMerchantActionState> {
  const access = await verifyRequestPlatformOwnerAccess();
  if (access.status === "denied") redirect("/login");
  if (access.status === "unavailable")
    return {
      status: "error",
      message: formatMessage("error.unexpected.message"),
    };
  try {
    const input = parseCreateMerchantInput({
      name: formData.get("name"),
      ownerEmail: formData.get("ownerEmail"),
      timezone: formData.get("timezone"),
      currencyCode: formData.get("currencyCode"),
    });
    const repository = createSupabasePlatformMerchantRepository(
      await createRequestSupabaseClient(),
    );
    await repository.create(input);
    revalidatePath("/control");
    return {
      status: "success",
      message: formatMessage("merchant.create.success"),
    };
  } catch {
    return {
      status: "error",
      message: formatMessage("merchant.create.invalid"),
    };
  }
}
