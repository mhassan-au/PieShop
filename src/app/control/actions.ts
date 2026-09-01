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
