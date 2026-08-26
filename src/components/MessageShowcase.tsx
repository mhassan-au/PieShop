"use client";

import { ErrorFallback } from "@/components/ErrorFallback";
import { formatMessage } from "@/messages/catalogue";

export function MessageShowcase() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-stone-950 text-stone-100">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.2),_transparent_42%),radial-gradient(circle_at_80%_20%,_rgba(244,63,94,0.14),_transparent_36%)]"
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 sm:py-8 lg:px-12">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-2xl bg-orange-400 font-serif text-xl font-bold text-stone-950 shadow-[0_10px_35px_rgba(251,146,60,0.22)]"
            >
              P
            </span>
            <span className="font-serif text-xl font-semibold tracking-tight">
              {formatMessage("brand.name")}
            </span>
          </div>
          <div className="rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1.5 text-xs font-medium text-orange-100">
            <span className="sr-only">
              {formatMessage("showcase.status.label")}:{" "}
            </span>
            {formatMessage("showcase.status.value")}
          </div>
        </header>

        <section className="py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.22em] text-orange-300 uppercase">
              {formatMessage("showcase.eyebrow")}
            </p>
            <h1 className="mt-5 font-serif text-5xl leading-[0.96] font-semibold tracking-[-0.045em] text-balance sm:text-6xl">
              <span className="sr-only">{formatMessage("brand.name")}. </span>
              {formatMessage("showcase.title")}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-stone-300 sm:text-lg">
              {formatMessage("showcase.description")}
            </p>
            <p className="mt-6 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-stone-400">
              {formatMessage("showcase.notice")}
            </p>
          </div>

          <section aria-labelledby="states-title" className="mt-12">
            <h2 id="states-title" className="sr-only">
              {formatMessage("showcase.states.title")}
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-amber-300 uppercase">
                  {formatMessage("showcase.validation.label")}
                </p>
                <p className="mt-4 text-base leading-7 text-stone-100">
                  {formatMessage("validation.phone.invalid")}
                </p>
              </article>

              <article className="rounded-3xl border border-sky-300/20 bg-sky-300/[0.06] p-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-sky-300 uppercase">
                  {formatMessage("showcase.confirmation.label")}
                </p>
                <h3 className="mt-4 text-lg font-semibold">
                  {formatMessage("confirmation.order.submit", {
                    customerName: "Alex",
                  })}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  {formatMessage("confirmation.order.detail")}
                </p>
                <button
                  type="button"
                  className="mt-5 rounded-full border border-sky-200/30 px-4 py-2.5 text-sm font-semibold text-sky-100 outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  {formatMessage("confirmation.order.action")}
                </button>
              </article>

              <article className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-emerald-300 uppercase">
                  {formatMessage("showcase.success.label")}
                </p>
                <h3 className="mt-4 text-lg font-semibold">
                  {formatMessage("success.order.ready", {
                    orderReference: "PS-1042",
                  })}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  {formatMessage("success.order.detail")}
                </p>
              </article>

              <ErrorFallback
                compact
                referenceId="err_demo_7K4M2P"
                onRetry={() => undefined}
              />
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
