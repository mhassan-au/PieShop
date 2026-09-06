"use client";

import { useActionState } from "react";
import {
  requestMerchantMagicLinkAction,
  type MagicLinkActionState,
} from "@/app/invite/actions";
import { formatMessage } from "@/messages/catalogue";
import { ActionFeedbackDialog } from "./ActionFeedbackDialog";

const initialState: MagicLinkActionState = { status: "idle" };

export function InvitationConfirmation({ token }: Readonly<{ token: string }>) {
  const [state, action, pending] = useActionState(
    requestMerchantMagicLinkAction,
    initialState,
  );
  return (
    <form action={action} className="mt-6">
      <input name="invitationToken" type="hidden" value={token} />
      <button
        className="min-h-12 w-full rounded-xl bg-orange-400 px-4 font-bold text-stone-950 disabled:opacity-60"
        disabled={pending}
      >
        {pending
          ? formatMessage("merchant.invitation.magicLinkSending")
          : formatMessage("merchant.invitation.magicLinkSend")}
      </button>
      <ActionFeedbackDialog state={state} />
    </form>
  );
}
