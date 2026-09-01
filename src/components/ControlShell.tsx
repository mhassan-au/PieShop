import { formatMessage } from "@/messages/catalogue";
import type { SafeOwnerSession } from "@/auth/supabase-owner-session-repository";

type Props = Readonly<{
  logoutAction: (formData: FormData) => void | Promise<void>;
  revokeSessionAction: (formData: FormData) => void | Promise<void>;
  sessions: SafeOwnerSession[];
}>;

function formatUtc(instant: string): string {
  return new Date(instant)
    .toISOString()
    .replace("T", " ")
    .replace(".000Z", " UTC");
}

export function ControlShell({
  logoutAction,
  revokeSessionAction,
  sessions,
}: Props) {
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
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 sm:inline-flex">
              {formatMessage("auth.owner.control.eyebrow")}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-stone-200 transition hover:border-orange-300/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
              >
                {formatMessage("auth.owner.logout.submit")}
              </button>
            </form>
          </div>
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

          <section className="mt-6 max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <h2 className="font-serif text-2xl font-semibold">
              {formatMessage("auth.owner.sessions.title")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-400">
              {formatMessage("auth.owner.sessions.description")}
            </p>

            {sessions.length === 0 ? (
              <p className="mt-6 text-sm text-stone-400">
                {formatMessage("auth.owner.sessions.empty")}
              </p>
            ) : (
              <ul className="mt-6 space-y-4">
                {sessions.map((session) => {
                  const active = session.revokedAt === null;
                  return (
                    <li
                      key={session.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-stone-100">
                            {session.deviceLabel ||
                              formatMessage(
                                "auth.owner.sessions.unknownDevice",
                              )}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-emerald-200">
                            {formatMessage(
                              session.isCurrent
                                ? "auth.owner.sessions.current"
                                : active
                                  ? "auth.owner.sessions.active"
                                  : "auth.owner.sessions.revoked",
                            )}
                          </p>
                        </div>
                        {active && !session.isCurrent ? (
                          <form action={revokeSessionAction}>
                            <input
                              type="hidden"
                              name="sessionId"
                              value={session.id}
                            />
                            <button
                              type="submit"
                              className="rounded-xl border border-red-300/25 px-3 py-2 text-sm font-semibold text-red-100 transition hover:border-red-300/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
                            >
                              {formatMessage("auth.owner.sessions.revoke")}
                            </button>
                          </form>
                        ) : null}
                      </div>
                      <dl className="mt-4 grid gap-3 text-xs text-stone-400 sm:grid-cols-3">
                        {(
                          [
                            ["auth.owner.sessions.created", session.createdAt],
                            [
                              "auth.owner.sessions.lastActive",
                              session.lastActivityAt,
                            ],
                            [
                              "auth.owner.sessions.expires",
                              session.absoluteExpiresAt,
                            ],
                          ] as const
                        ).map(([label, value]) => (
                          <div key={label}>
                            <dt>{formatMessage(label)}</dt>
                            <dd className="mt-1 text-stone-200">
                              <time dateTime={value}>{formatUtc(value)}</time>
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
