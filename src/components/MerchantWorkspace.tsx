"use client";

import { useState } from "react";

import {
  merchantLogoutAction,
  type MerchantSettingsActionState,
} from "@/app/merchant/actions";
import { deriveSetupState } from "@/merchant-settings/merchant-settings";
import { formatMessage } from "@/messages/catalogue";
import { ActionFeedbackDialog } from "./ActionFeedbackDialog";

type Settings = Readonly<{
  businessId: string;
  businessName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  currencyCode: "AUD";
  timezone: "Australia/Sydney";
  version: number;
  updatedAt: string;
}>;

const destinations = ["Today", "Orders", "Catalogue", "Settings"] as const;

export function MerchantWorkspace({
  initialFeedback,
  settings,
}: Readonly<{
  initialFeedback?: MerchantSettingsActionState;
  settings: Settings;
}>) {
  const [destination, setDestination] =
    useState<(typeof destinations)[number]>("Settings");
  const [submitting, setSubmitting] = useState(false);
  const progress = deriveSetupState(settings);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-orange-300 uppercase">
            Merchant workspace
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold">
            {settings.businessName}
          </h1>
        </div>
        <form action={merchantLogoutAction}>
          <button className="min-h-11 rounded-xl border border-white/20 px-4 text-sm font-semibold">
            {formatMessage("auth.merchant.logout.submit")}
          </button>
        </form>
      </header>

      <nav
        aria-label="Merchant workspace"
        className="mt-6 grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1"
      >
        {destinations.map((item) => (
          <button
            aria-pressed={destination === item}
            className="min-h-11 rounded-xl px-2 text-xs font-semibold aria-pressed:bg-orange-400 aria-pressed:text-stone-950 sm:text-sm"
            key={item}
            onClick={() => setDestination(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </nav>

      {destination === "Settings" ? (
        <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm font-semibold text-orange-200">
              {progress.completed} of {progress.total} setup steps complete
            </p>
            <div
              aria-label="Setup progress"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progress.percent}
              className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
            >
              <div
                className="h-full bg-orange-400"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="mt-4 text-sm text-stone-400">
              Your progress is saved automatically after each valid update.
            </p>
          </aside>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <h2 className="font-serif text-2xl font-semibold">
              Business settings
            </h2>
            <p className="mt-2 text-sm text-stone-400">
              Private synthetic development data only.
            </p>
            <form
              action="/merchant/settings"
              className="mt-6 space-y-4"
              key={settings.version}
              method="post"
              noValidate
              onSubmit={() => setSubmitting(true)}
            >
              <label
                className="block text-sm font-semibold"
                htmlFor="businessName"
              >
                Business name
              </label>
              <input
                className="min-h-12 w-full rounded-xl border border-white/15 bg-stone-950 px-4"
                defaultValue={settings.businessName}
                id="businessName"
                maxLength={120}
                name="businessName"
                required
              />
              <label
                className="block text-sm font-semibold"
                htmlFor="contactEmail"
              >
                Business contact email
              </label>
              <input
                autoComplete="email"
                className="min-h-12 w-full rounded-xl border border-white/15 bg-stone-950 px-4"
                defaultValue={settings.contactEmail ?? ""}
                id="contactEmail"
                maxLength={254}
                name="contactEmail"
                required
                type="email"
              />
              <label
                className="block text-sm font-semibold"
                htmlFor="contactPhone"
              >
                Business contact phone
              </label>
              <input
                autoComplete="tel"
                className="min-h-12 w-full rounded-xl border border-white/15 bg-stone-950 px-4"
                defaultValue={settings.contactPhone ?? ""}
                id="contactPhone"
                maxLength={24}
                name="contactPhone"
                placeholder="+61412345678"
                required
                type="tel"
              />
              <label className="block text-sm font-semibold" htmlFor="timezone">
                Timezone
              </label>
              <select
                className="min-h-12 w-full rounded-xl border border-white/15 bg-stone-950 px-4"
                defaultValue={settings.timezone}
                id="timezone"
                name="timezone"
              >
                <option value="Australia/Sydney">Australia/Sydney</option>
              </select>
              <input
                name="currencyCode"
                type="hidden"
                value={settings.currencyCode}
              />
              <input name="version" type="hidden" value={settings.version} />
              <button
                className="min-h-12 w-full rounded-xl bg-orange-400 px-4 font-bold text-stone-950 disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Save settings"}
              </button>
              <ActionFeedbackDialog
                state={initialFeedback ?? { status: "idle" }}
              />
            </form>
          </section>
        </section>
      ) : (
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <h2 className="font-serif text-2xl font-semibold">{destination}</h2>
          <p className="mt-3 text-stone-400">
            This workspace section is coming in a later approved part.
          </p>
        </section>
      )}
    </main>
  );
}
