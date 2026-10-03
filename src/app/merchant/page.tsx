import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { verifyRequestMerchantAccess } from "@/auth/merchant-request-access";
import { readMerchantSessionCookie } from "@/auth/merchant-session-cookie";
import { hashSessionToken } from "@/auth/session-token";
import { loadEnvironment } from "@/config/env";
import { MerchantWorkspace } from "@/components/MerchantWorkspace";
import { createSupabaseMerchantSettingsRepository } from "@/merchant-settings/supabase-merchant-settings-repository";
import { createRequestSupabaseClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

export default async function MerchantPage() {
  const access = await verifyRequestMerchantAccess();
  if (!access) redirect("/merchant/login");
  const environment = loadEnvironment(process.env);
  const token = readMerchantSessionCookie(await cookies(), environment.APP_ENV);
  const sessionTokenHash = await hashSessionToken(token);
  if (!sessionTokenHash) redirect("/merchant/login");
  const settings = await createSupabaseMerchantSettingsRepository(
    await createRequestSupabaseClient(),
  ).get(sessionTokenHash);
  return <MerchantWorkspace settings={settings} />;
}
