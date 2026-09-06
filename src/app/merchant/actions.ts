"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { logoutMerchant } from "@/auth/merchant-logout-service";
import {
  clearMerchantSessionCookie,
  readMerchantSessionCookie,
} from "@/auth/merchant-session-cookie";
import { createSupabaseOwnerAuthProvider } from "@/auth/supabase-owner-auth-provider";
import { createSupabaseMerchantSessionRepository } from "@/auth/supabase-merchant-session-repository";
import { loadEnvironment } from "@/config/env";
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
