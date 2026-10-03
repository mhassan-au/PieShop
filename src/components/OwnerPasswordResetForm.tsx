"use client";

import { useActionState } from "react";

import {
  completeOwnerPasswordRecoveryAction,
  type RecoveryActionState,
} from "@/app/recover/actions";
import { formatMessage } from "@/messages/catalogue";
import { ActionFeedbackDialog } from "./ActionFeedbackDialog";

const initialState: RecoveryActionState = { status: "idle" };

export function OwnerPasswordResetForm() {
  const [state, action, pending] = useActionState(
    completeOwnerPasswordRecoveryAction,
    initialState,
  );
  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      <div>
        <label
          className="mb-2 block text-sm font-semibold"
          htmlFor="new-password"
        >
          {formatMessage("auth.owner.recovery.password.label")}
        </label>
        <input
          autoComplete="new-password"
          className="min-h-12 w-full rounded-2xl border border-white/15 bg-stone-950/70 px-4 py-3 outline-none focus:border-orange-300"
          id="new-password"
          maxLength={1024}
          name="password"
          required
          type="password"
        />
      </div>
      <div>
        <label
          className="mb-2 block text-sm font-semibold"
          htmlFor="confirm-password"
        >
          {formatMessage("auth.owner.recovery.confirmation.label")}
        </label>
        <input
          autoComplete="new-password"
          className="min-h-12 w-full rounded-2xl border border-white/15 bg-stone-950/70 px-4 py-3 outline-none focus:border-orange-300"
          id="confirm-password"
          maxLength={1024}
          name="confirmation"
          required
          type="password"
        />
      </div>
      <p className="text-xs leading-5 text-stone-400">
        {formatMessage("auth.owner.recovery.password.help")}
      </p>
      <ActionFeedbackDialog state={state} />
      <button
        className="min-h-12 w-full rounded-2xl bg-orange-400 px-5 py-3 text-sm font-bold text-stone-950 disabled:opacity-65"
        disabled={pending}
        type="submit"
      >
        {formatMessage(
          pending
            ? "auth.owner.recovery.password.submitting"
            : "auth.owner.recovery.password.submit",
        )}
      </button>
    </form>
  );
}
