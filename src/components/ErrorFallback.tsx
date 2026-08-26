"use client";

import { useId } from "react";

import { formatMessage } from "@/messages/catalogue";

type ErrorFallbackProps = {
  referenceId: string;
  onRetry: () => void;
  compact?: boolean;
};

export function ErrorFallback({
  referenceId,
  onRetry,
  compact = false,
}: ErrorFallbackProps) {
  const titleId = useId();
  const Heading = compact ? "h3" : "h1";

  return (
    <section
      aria-labelledby={titleId}
      className={
        compact
          ? "rounded-3xl border border-rose-300/20 bg-rose-300/[0.06] p-5"
          : "grid min-h-screen place-items-center bg-stone-950 p-5 text-stone-100"
      }
    >
      <div
        className={
          compact
            ? ""
            : "w-full max-w-lg rounded-[2rem] border border-white/10 bg-stone-900 p-7 shadow-2xl"
        }
      >
        <p className="text-xs font-semibold tracking-[0.18em] text-rose-300 uppercase">
          {formatMessage("showcase.failure.label")}
        </p>
        <Heading
          id={titleId}
          className="mt-3 font-serif text-2xl font-semibold text-stone-100"
        >
          {formatMessage("error.unexpected.title")}
        </Heading>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          {formatMessage("error.unexpected.message")}
        </p>
        <p className="mt-4 font-mono text-xs text-stone-400">
          {formatMessage("error.reference", { referenceId })}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-full bg-stone-100 px-4 py-2.5 text-sm font-semibold text-stone-950 transition outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
        >
          {formatMessage("error.retry")}
        </button>
      </div>
    </section>
  );
}
