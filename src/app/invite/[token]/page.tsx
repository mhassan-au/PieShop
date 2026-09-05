import type { Metadata } from "next";

import { InvitationPreview } from "@/components/InvitationPreview";
import { hashInvitationToken } from "@/invitations/invitation-token";
import { createSupabasePlatformInvitationRepository } from "@/invitations/supabase-platform-invitation-repository";
import { formatMessage } from "@/messages/catalogue";
import { createRequestSupabaseClient } from "@/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: `${formatMessage("merchant.invitation.page.title")} | ${formatMessage("brand.name")}`,
  referrer: "no-referrer",
};

export default async function InvitationPage({
  params,
}: Readonly<{ params: Promise<{ token: string }> }>) {
  let invitation = null;
  try {
    const { token } = await params;
    const repository = createSupabasePlatformInvitationRepository(
      await createRequestSupabaseClient(),
    );
    invitation = await repository.inspect(hashInvitationToken(token));
  } catch {
    invitation = null;
  }
  return <InvitationPreview invitation={invitation} />;
}
