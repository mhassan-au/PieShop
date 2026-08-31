import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { verifyRequestPlatformOwnerAccess } from "@/auth/owner-request-access";
import { ControlShell } from "@/components/ControlShell";
import { formatMessage } from "@/messages/catalogue";

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

  return <ControlShell />;
}
