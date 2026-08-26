import { foundationMessages as messages } from "@/messages/en-AU";

export function FoundationShell() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-stone-950 text-stone-100">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.2),_transparent_42%),radial-gradient(circle_at_80%_20%,_rgba(244,63,94,0.14),_transparent_36%)]"
      />

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-12">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-2xl bg-orange-400 font-serif text-xl font-bold text-stone-950 shadow-[0_10px_35px_rgba(251,146,60,0.22)]"
            >
              P
            </span>
            <span className="font-serif text-xl font-semibold tracking-tight">
              {messages.brand}
            </span>
          </div>

          <div className="rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1.5 text-xs font-medium text-orange-100">
            <span className="sr-only">{messages.statusLabel}: </span>
            {messages.statusValue}
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.12fr_0.88fr] lg:py-20">
          <div>
            <p className="mb-5 text-xs font-semibold tracking-[0.22em] text-orange-300 uppercase">
              {messages.eyebrow}
            </p>
            <h1 className="max-w-3xl font-serif text-5xl leading-[0.96] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-7xl">
              <span className="sr-only">{messages.brand}. </span>
              {messages.title}
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-stone-300 sm:text-lg sm:leading-8">
              {messages.description}
            </p>

            <div className="mt-10 flex items-center gap-3 text-sm text-stone-400">
              <span className="h-px w-10 bg-orange-300/60" />
              <span>{messages.footer}</span>
            </div>
          </div>

          <aside
            aria-labelledby="principles-title"
            className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-7"
          >
            <h2
              id="principles-title"
              className="font-serif text-2xl font-semibold tracking-tight"
            >
              {messages.principlesTitle}
            </h2>

            <div className="mt-5 divide-y divide-white/10">
              {messages.principles.map((principle, index) => (
                <article
                  className="grid grid-cols-[2.25rem_1fr] gap-3 py-5"
                  key={principle.title}
                >
                  <span
                    aria-hidden="true"
                    className="pt-0.5 font-mono text-xs text-orange-300"
                  >
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="font-medium text-stone-100">
                      {principle.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-stone-400">
                      {principle.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-stone-900/80 p-4 ring-1 ring-white/10">
              <h2 className="text-sm font-semibold text-orange-200">
                {messages.nextTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                {messages.nextDescription}
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
