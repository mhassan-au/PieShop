import { formatMessage } from "@/messages/catalogue";
import { formatCriticalAlert } from "@/observability/critical-alerts";
import {
  createLogger,
  InMemoryLogSink,
  serializeJsonLine,
} from "@/observability/logger";
import { DatabaseHealthPanel } from "./DatabaseHealthPanel";

export async function ObservabilityShowcase() {
  const sink = new InMemoryLogSink();
  const logger = createLogger({
    environment: "test",
    service: "merchant-web",
    minimumLevel: "debug",
    sink,
    clock: () => new Date("2026-08-27T03:04:05.006Z"),
  });

  await logger.debug("catalogue.preview_opened", {
    outcome: "success",
    requestId: "req_demo_82K1",
    traceId: "trace_demo_41PX",
    businessId: "biz_demo_07",
    context: {
      view: "catalogue_preview",
      password: "synthetic-password",
      phone: "+61 400 000 123",
      address: "12 Example Street",
    },
  });

  const debugEvent = sink.events[0]!;
  const alertPreview = formatCriticalAlert({
    ...debugEvent,
    level: "fatal",
    event: "database.connection_failed",
    errorCode: "DATABASE_UNAVAILABLE",
    referenceId: "err_demo_7K4M2P",
    outcome: "failed",
  });

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-stone-950 text-stone-100">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[45rem] bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.2),_transparent_42%),radial-gradient(circle_at_78%_18%,_rgba(34,197,94,0.12),_transparent_34%)]"
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
          <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
            <span className="sr-only">
              {formatMessage("observability.status.label")}:{" "}
            </span>
            {formatMessage("observability.status.value")}
          </div>
        </header>

        <section className="py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.22em] text-orange-300 uppercase">
              {formatMessage("observability.eyebrow")}
            </p>
            <h1 className="mt-5 font-serif text-5xl leading-[0.96] font-semibold tracking-[-0.045em] text-balance sm:text-6xl">
              <span className="sr-only">{formatMessage("brand.name")}. </span>
              {formatMessage("observability.title")}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-stone-300 sm:text-lg">
              {formatMessage("observability.description")}
            </p>
            <p className="mt-6 inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-4 py-2 text-sm text-emerald-100">
              {formatMessage("observability.notice")}
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            <article className="min-w-0 rounded-3xl border border-sky-300/20 bg-sky-300/[0.05] p-5 sm:p-6">
              <p className="text-xs font-semibold tracking-[0.18em] text-sky-300 uppercase">
                {formatMessage("observability.debug.label")}
              </p>
              <h2 className="mt-3 font-serif text-2xl font-semibold">
                {formatMessage("observability.debug.title")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                {formatMessage("observability.debug.description")}
              </p>
              <pre className="mt-5 overflow-x-auto rounded-2xl bg-stone-950/80 p-4 font-mono text-xs leading-6 break-words whitespace-pre-wrap text-sky-100 ring-1 ring-white/10">
                {serializeJsonLine(debugEvent).trimEnd()}
              </pre>
            </article>

            <article className="min-w-0 rounded-3xl border border-rose-300/20 bg-rose-300/[0.05] p-5 sm:p-6">
              <p className="text-xs font-semibold tracking-[0.18em] text-rose-300 uppercase">
                {formatMessage("observability.alert.label")}
              </p>
              <h2 className="mt-3 font-serif text-2xl font-semibold">
                {formatMessage("observability.alert.title")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                {formatMessage("observability.alert.description")}
              </p>
              <pre className="mt-5 overflow-x-auto rounded-2xl bg-stone-950/80 p-4 font-mono text-xs leading-6 break-words whitespace-pre-wrap text-rose-100 ring-1 ring-white/10">
                {alertPreview}
              </pre>
            </article>
          </div>

          <section
            aria-labelledby="controls-title"
            className="mt-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6"
          >
            <h2
              id="controls-title"
              className="font-serif text-xl font-semibold"
            >
              {formatMessage("observability.controls.title")}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-stone-300">
              {[
                formatMessage("observability.controls.redaction"),
                formatMessage("observability.controls.correlation"),
                formatMessage("observability.controls.providers"),
              ].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/10 bg-stone-900 px-3 py-2"
                >
                  {label}
                </span>
              ))}
            </div>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-stone-400">
              {formatMessage("observability.next")}
            </p>
          </section>
          <DatabaseHealthPanel
            isConfigured={Boolean(
              process.env.NEXT_PUBLIC_SUPABASE_URL &&
              process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
              process.env.SUPABASE_DB_URL,
            )}
          />
        </section>
      </div>
    </main>
  );
}
