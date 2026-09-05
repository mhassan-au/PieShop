import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { ApplicationEnvironment } from "@/config/env";

const ADMIN_CONFIGURATION_ERROR = "Server data access is unavailable";

export function createSupabaseAdminClient(environment: ApplicationEnvironment) {
  if (
    !environment.NEXT_PUBLIC_SUPABASE_URL ||
    !environment.SUPABASE_SECRET_KEY
  ) {
    throw new Error(ADMIN_CONFIGURATION_ERROR);
  }

  return createClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.SUPABASE_SECRET_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
