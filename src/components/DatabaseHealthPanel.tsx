import { formatMessage } from "@/messages/catalogue";

type DatabaseHealthPanelProps = {
  isConfigured: boolean;
};

export function DatabaseHealthPanel({
  isConfigured,
}: DatabaseHealthPanelProps) {
  return (
    <section
      aria-labelledby="database-health-title"
      className="mt-4 rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.05] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-emerald-300 uppercase">
            {formatMessage("database.health.label")}
          </p>
          <h2
            id="database-health-title"
            className="mt-3 font-serif text-2xl font-semibold"
          >
            {formatMessage("database.health.title")}
          </h2>
        </div>
        <span
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
            isConfigured
              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
              : "border-amber-300/20 bg-amber-300/10 text-amber-100"
          }`}
        >
          {formatMessage(
            isConfigured
              ? "database.health.ready"
              : "database.health.incomplete",
          )}
        </span>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-300">
        {formatMessage("database.health.description")}
      </p>
      <p className="mt-3 text-sm font-medium text-emerald-100">
        {formatMessage("database.health.privacy")}
      </p>
      <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-stone-300">
        {[
          formatMessage("database.health.control.rls"),
          formatMessage("database.health.control.tenant"),
          formatMessage("database.health.control.immutable"),
        ].map((label) => (
          <span
            key={label}
            className="rounded-full border border-white/10 bg-stone-900 px-3 py-2"
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
