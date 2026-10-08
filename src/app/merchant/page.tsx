import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { verifyRequestMerchantAccess } from "@/auth/merchant-request-access";
import { readMerchantSessionCookie } from "@/auth/merchant-session-cookie";
import { hashSessionToken } from "@/auth/session-token";
import { loadEnvironment } from "@/config/env";
import { MerchantWorkspace } from "@/components/MerchantWorkspace";
import { createSupabaseMerchantSettingsRepository } from "@/merchant-settings/supabase-merchant-settings-repository";
import { createRequestSupabaseClient } from "@/supabase/server";
import { formatMessage } from "@/messages/catalogue";

export const dynamic = "force-dynamic";

type MerchantPageProps = Readonly<{
  searchParams: Promise<{ settings?: string | string[] }>;
}>;

export default async function MerchantPage({
  searchParams,
}: MerchantPageProps) {
  const access = await verifyRequestMerchantAccess();
  if (!access) redirect("/merchant/login");
  const environment = loadEnvironment(process.env);
  const token = readMerchantSessionCookie(await cookies(), environment.APP_ENV);
  const sessionTokenHash = await hashSessionToken(token);
  if (!sessionTokenHash) redirect("/merchant/login");
  const settings = await createSupabaseMerchantSettingsRepository(
    await createRequestSupabaseClient(),
  ).get(sessionTokenHash);
  const result = (await searchParams).settings;
  const feedback =
    result === "saved"
      ? {
          status: "success" as const,
          message: formatMessage("merchant.settings.update.success"),
        }
      : result === "conflict"
        ? {
            status: "error" as const,
            message: formatMessage("merchant.settings.update.conflict"),
          }
        : result === "failed"
          ? {
              status: "error" as const,
              message: formatMessage("merchant.settings.update.failure"),
            }
          : { status: "idle" as const };
  return <MerchantWorkspace initialFeedback={feedback} settings={settings} />;
}
