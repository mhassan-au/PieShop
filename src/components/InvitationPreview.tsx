import { formatMessage } from "@/messages/catalogue";
import type { InvitationInspection } from "@/invitations/supabase-platform-invitation-repository";

export function InvitationPreview({
  invitation,
}: Readonly<{ invitation: InvitationInspection | null }>) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-5 py-12">
      <section className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-10">
        <p className="text-xs font-bold tracking-[0.2em] text-orange-300 uppercase">
          {formatMessage("merchant.invitation.page.eyebrow")}
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold">
          {formatMessage("merchant.invitation.page.title")}
        </h1>
        {invitation ? (
          <>
            <p className="mt-5 text-stone-200">
              {formatMessage("merchant.invitation.page.valid", {
                businessName: invitation.businessName,
              })}
            </p>
            <p className="mt-2 text-sm text-stone-400">
              {formatMessage("merchant.invitation.page.expires", {
                expiresAt: invitation.expiresAt,
              })}
            </p>
            <p className="mt-6 rounded-2xl border border-orange-300/20 bg-orange-300/5 p-4 text-sm text-orange-100">
              {formatMessage("merchant.invitation.page.pendingDelivery")}
            </p>
          </>
        ) : (
          <p className="mt-5 text-stone-300">
            {formatMessage("merchant.invitation.page.unavailable")}
          </p>
        )}
      </section>
    </main>
  );
}
