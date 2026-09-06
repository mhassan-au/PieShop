"use client";

import { useActionState } from "react";

import {
  ownerLoginAction,
  type OwnerLoginActionState,
} from "@/app/login/actions";
import { formatMessage } from "@/messages/catalogue";
import { ActionFeedbackDialog } from "./ActionFeedbackDialog";

const initialState: OwnerLoginActionState = { status: "idle" };

export function OwnerLoginForm() {
  const [state, formAction, pending] = useActionState(
    ownerLoginAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      <div>
        <label
          className="mb-2 block text-sm font-semibold text-stone-200"
          htmlFor="owner-email"
        >
          {formatMessage("auth.owner.login.email.label")}
        </label>
        <input
          autoComplete="email"
          autoFocus
          className="min-h-12 w-full rounded-2xl border border-white/15 bg-stone-950/70 px-4 py-3 text-base text-stone-100 transition outline-none placeholder:text-stone-600 focus:border-orange-300 focus:ring-4 focus:ring-orange-300/10"
          id="owner-email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-semibold text-stone-200"
          htmlFor="owner-password"
        >
          {formatMessage("auth.owner.login.password.label")}
        </label>
        <input
          autoComplete="current-password"
          className="min-h-12 w-full rounded-2xl border border-white/15 bg-stone-950/70 px-4 py-3 text-base text-stone-100 transition outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-300/10"
          id="owner-password"
          maxLength={1024}
          name="password"
          required
          type="password"
        />
      </div>

      <ActionFeedbackDialog state={state} />

      <button
        className="min-h-12 w-full rounded-2xl bg-orange-400 px-5 py-3 text-sm font-bold text-stone-950 shadow-[0_14px_38px_rgba(251,146,60,0.2)] transition hover:bg-orange-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300 disabled:cursor-wait disabled:opacity-65"
        disabled={pending}
        type="submit"
      >
        {pending
          ? formatMessage("auth.owner.login.submitting")
          : formatMessage("auth.owner.login.submit")}
      </button>
    </form>
  );
}
