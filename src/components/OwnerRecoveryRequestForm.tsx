"use client";

import { useActionState } from "react";

import {
  requestOwnerPasswordRecoveryAction,
  type RecoveryActionState,
} from "@/app/recover/actions";
import { formatMessage } from "@/messages/catalogue";
import { ActionFeedbackDialog } from "./ActionFeedbackDialog";

const initialState: RecoveryActionState = { status: "idle" };

export function OwnerRecoveryRequestForm() {
  const [state, action, pending] = useActionState(
    requestOwnerPasswordRecoveryAction,
    initialState,
  );
  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      <label className="block text-sm font-semibold" htmlFor="recovery-email">
        {formatMessage("auth.owner.login.email.label")}
      </label>
      <input
        autoComplete="email"
        autoFocus
        className="min-h-12 w-full rounded-2xl border border-white/15 bg-stone-950/70 px-4 py-3 outline-none focus:border-orange-300"
        id="recovery-email"
        maxLength={254}
        name="email"
        required
        type="email"
      />
      <ActionFeedbackDialog state={state} />
      <button
        className="min-h-12 w-full rounded-2xl bg-orange-400 px-5 py-3 text-sm font-bold text-stone-950 disabled:opacity-65"
        disabled={pending}
        type="submit"
      >
        {formatMessage(
          pending
            ? "auth.owner.recovery.request.submitting"
            : "auth.owner.recovery.request.submit",
        )}
      </button>
    </form>
  );
}
