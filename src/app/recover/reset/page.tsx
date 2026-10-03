import type { Metadata } from "next";

import { OwnerPasswordResetForm } from "@/components/OwnerPasswordResetForm";
import { formatMessage } from "@/messages/catalogue";

export const metadata: Metadata = {
  title: `${formatMessage("auth.owner.recovery.password.title")} | ${formatMessage("brand.name")}`,
};

export default function OwnerPasswordResetPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-stone-950 px-5 py-10 text-stone-100">
      <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-stone-900 p-6 sm:p-9">
        <p className="text-xs font-semibold tracking-[0.2em] text-orange-300 uppercase">
          {formatMessage("auth.owner.login.eyebrow")}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold">
          {formatMessage("auth.owner.recovery.password.title")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          {formatMessage("auth.owner.recovery.password.description")}
        </p>
        <OwnerPasswordResetForm />
      </section>
    </main>
  );
}
