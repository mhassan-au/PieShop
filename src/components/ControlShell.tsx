import { formatMessage } from "@/messages/catalogue";

export function ControlShell() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-stone-950 text-stone-100">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_45%),radial-gradient(circle_at_80%_10%,_rgba(34,197,94,0.1),_transparent_32%)]"
      />
      <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 sm:py-8 lg:px-12">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-2xl bg-orange-400 font-serif text-xl font-bold text-stone-950"
            >
              P
            </span>
            <span className="font-serif text-xl font-semibold">
              {formatMessage("brand.name")}
            </span>
          </div>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
            {formatMessage("auth.owner.control.eyebrow")}
          </span>
        </header>

        <section className="py-14 sm:py-20">
          <p className="text-xs font-semibold tracking-[0.22em] text-orange-300 uppercase">
            {formatMessage("auth.owner.control.eyebrow")}
          </p>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-6xl">
            {formatMessage("auth.owner.control.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-stone-300 sm:text-lg">
            {formatMessage("auth.owner.control.description")}
          </p>

          <section className="mt-12 max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <div className="grid size-11 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
              <span aria-hidden="true">✓</span>
            </div>
            <h2 className="mt-5 font-serif text-2xl font-semibold">
              {formatMessage("auth.owner.control.empty.title")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-400">
              {formatMessage("auth.owner.control.empty.description")}
            </p>
          </section>
        </section>
      </div>
    </main>
  );
}
