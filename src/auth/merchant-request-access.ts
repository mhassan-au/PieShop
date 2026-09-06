import "server-only";

import { cookies } from "next/headers";

import { loadEnvironment } from "@/config/env";
import { hashSessionToken } from "./session-token";
import { readMerchantSessionCookie } from "./merchant-session-cookie";
import { createSupabaseMerchantSessionRepository } from "./supabase-merchant-session-repository";
import { createRequestSupabaseClient } from "@/supabase/server";

export async function verifyRequestMerchantAccess() {
  try {
    const environment = loadEnvironment(process.env);
    const token = readMerchantSessionCookie(
      await cookies(),
      environment.APP_ENV,
    );
    const hash = await hashSessionToken(token);
    if (!hash) return null;
    return await createSupabaseMerchantSessionRepository(
      await createRequestSupabaseClient(),
    ).verify(hash);
  } catch {
    return null;
  }
}
