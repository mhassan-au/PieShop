"use client";

import { useActionState } from "react";
import {
  createMerchantAction,
  type CreateMerchantActionState,
} from "@/app/control/actions";
import { formatMessage } from "@/messages/catalogue";
import type { PlatformMerchant } from "@/merchants/platform-merchant";

const initialState: CreateMerchantActionState = { status: "idle" };

export function MerchantDashboard({
  merchants,
}: Readonly<{ merchants: PlatformMerchant[] }>) {
  const [state, action, pending] = useActionState(
    createMerchantAction,
    initialState,
  );
  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold">
          {formatMessage("merchant.create.title")}
        </h2>
        <form action={action} className="mt-6 space-y-4" noValidate>
          <label
            className="block text-sm font-semibold"
            htmlFor="merchant-name"
          >
            {formatMessage("merchant.create.name")}
          </label>
          <input
            className="min-h-12 w-full rounded-xl border border-white/15 bg-stone-950 px-4"
            id="merchant-name"
            maxLength={120}
            name="name"
            required
          />
          <label
            className="block text-sm font-semibold"
            htmlFor="merchant-email"
          >
            {formatMessage("merchant.create.email")}
          </label>
          <input
            autoComplete="email"
            className="min-h-12 w-full rounded-xl border border-white/15 bg-stone-950 px-4"
            id="merchant-email"
            maxLength={254}
            name="ownerEmail"
            required
            type="email"
          />
          <label
            className="block text-sm font-semibold"
            htmlFor="merchant-timezone"
          >
            {formatMessage("merchant.create.timezone")}
          </label>
          <select
            className="min-h-12 w-full rounded-xl border border-white/15 bg-stone-950 px-4"
            defaultValue="Australia/Sydney"
            id="merchant-timezone"
            name="timezone"
          >
            <option>Australia/Sydney</option>
          </select>
          <input name="currencyCode" type="hidden" value="AUD" />
          <div aria-live="polite" className="min-h-6 text-sm">
            {state.message}
          </div>
          <button
            className="min-h-12 w-full rounded-xl bg-orange-400 px-4 font-bold text-stone-950 disabled:opacity-60"
            disabled={pending}
          >
            {pending
              ? formatMessage("merchant.create.submitting")
              : formatMessage("merchant.create.submit")}
          </button>
        </form>
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold">
          {formatMessage("merchant.dashboard.title")}
        </h2>
        <p className="mt-2 text-sm text-stone-400">
          {formatMessage("merchant.dashboard.description")}
        </p>
        {merchants.length === 0 ? (
          <p className="mt-6 text-sm text-stone-400">
            {formatMessage("merchant.list.empty")}
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {merchants.map((merchant) => (
              <li
                className="rounded-2xl border border-white/10 p-4"
                key={merchant.id}
              >
                <p className="font-semibold">{merchant.name}</p>
                <p className="mt-1 text-xs text-orange-200">
                  {formatMessage(`merchant.status.${merchant.status}`)} ·{" "}
                  {formatMessage(
                    `merchant.invitation.${merchant.invitationStatus}`,
                  )}
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  {merchant.publicId} · {merchant.timezone} ·{" "}
                  {merchant.currencyCode}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
