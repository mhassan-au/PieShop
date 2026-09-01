import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verifyRequestPlatformOwnerAccess } from "@/auth/owner-request-access";
import { readOwnerSessionCookie } from "@/auth/owner-session-cookie";
import { hashSessionToken } from "@/auth/session-token";
import { createSupabaseOwnerSessionRepository } from "@/auth/supabase-owner-session-repository";
import { ControlShell } from "@/components/ControlShell";
import { loadEnvironment } from "@/config/env";
import { formatMessage } from "@/messages/catalogue";
import { createSupabasePlatformMerchantRepository } from "@/merchants/supabase-platform-merchant-repository";
import { createRequestSupabaseClient } from "@/supabase/server";

import { ownerLogoutAction, revokeOwnerSessionAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: `${formatMessage("auth.owner.control.title")} | ${formatMessage("brand.name")}`,
};

export default async function ControlPage() {
  const access = await verifyRequestPlatformOwnerAccess();

  if (access.status === "denied") {
    redirect("/login");
  }
  if (access.status === "unavailable") {
    throw new Error("Owner access verification failed");
  }

  const environment = loadEnvironment(process.env);
  const currentTokenHash = await hashSessionToken(
    readOwnerSessionCookie(await cookies(), environment.APP_ENV),
  );
  if (!currentTokenHash) redirect("/login");

  const sessions = await createSupabaseOwnerSessionRepository(
    await createRequestSupabaseClient(),
  ).list(currentTokenHash);
  const merchants = await createSupabasePlatformMerchantRepository(
    await createRequestSupabaseClient(),
  ).list();

  return (
    <ControlShell
      logoutAction={ownerLogoutAction}
      revokeSessionAction={revokeOwnerSessionAction}
      sessions={sessions}
      merchants={merchants}
    />
  );
}
