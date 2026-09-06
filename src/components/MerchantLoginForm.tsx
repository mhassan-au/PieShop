"use client";

import { useActionState } from "react";

import {
  requestReturningMerchantMagicLinkAction,
  type MerchantLoginActionState,
} from "@/app/merchant/login/actions";
import { formatMessage } from "@/messages/catalogue";
import { ActionFeedbackDialog } from "./ActionFeedbackDialog";

const initialState: MerchantLoginActionState = { status: "idle" };

export function MerchantLoginForm() {
  const [state, formAction, pending] = useActionState(
    requestReturningMerchantMagicLinkAction,
    initialState,
  );
  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      <div>
        <label
          className="mb-2 block text-sm font-semibold text-stone-200"
          htmlFor="merchant-email"
        >
          {formatMessage("auth.merchant.login.email.label")}
        </label>
        <input
          autoComplete="email"
          autoFocus
          className="min-h-12 w-full rounded-2xl border border-white/15 bg-stone-950/70 px-4 py-3 text-base text-stone-100 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-300/10"
          id="merchant-email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </div>
      <ActionFeedbackDialog state={state} />
      <button
        className="min-h-12 w-full rounded-2xl bg-orange-400 px-5 py-3 text-sm font-bold text-stone-950 transition hover:bg-orange-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300 disabled:cursor-wait disabled:opacity-65"
        disabled={pending}
        type="submit"
      >
        {pending
          ? formatMessage("auth.merchant.login.submitting")
          : formatMessage("auth.merchant.login.submit")}
      </button>
    </form>
  );
}
