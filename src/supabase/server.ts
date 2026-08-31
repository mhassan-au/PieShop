import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { createSupabaseServerCookieMethods } from "@/auth/supabase-server-cookie-policy";
import { loadEnvironment } from "@/config/env";

export async function createRequestSupabaseClient() {
  const environment = loadEnvironment(process.env);
  const supabaseUrl = environment.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase server configuration is unavailable");
  }

  const cookieStore = await cookies();
  const cookieMethods = createSupabaseServerCookieMethods(
    {
      getAll: () =>
        cookieStore.getAll().map(({ name, value }) => ({ name, value })),
      set: (name, value, options) => cookieStore.set(name, value, options),
    },
    environment.APP_ENV,
  );

  return createServerClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: "pkce",
      persistSession: true,
    },
    cookies: cookieMethods,
  });
}
