import type { Metadata } from "next";
import Link from "next/link";

import { MerchantLoginForm } from "@/components/MerchantLoginForm";
import { formatMessage } from "@/messages/catalogue";

export const metadata: Metadata = {
  title: `${formatMessage("auth.merchant.login.title")} | ${formatMessage("brand.name")}`,
};

export default function MerchantLoginPage() {
  return (
    <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-stone-950 px-5 py-10 text-stone-100">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,_rgba(251,146,60,0.2),_transparent_35%),radial-gradient(circle_at_82%_78%,_rgba(34,197,94,0.1),_transparent_34%)]"
      />
      <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-stone-900/80 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-9">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-11 place-items-center rounded-2xl bg-orange-400 font-serif text-xl font-bold text-stone-950"
          >
            P
          </span>
          <span className="font-serif text-xl font-semibold">
            {formatMessage("brand.name")}
          </span>
        </div>
        <p className="mt-9 text-xs font-semibold tracking-[0.2em] text-orange-300 uppercase">
          {formatMessage("auth.merchant.login.eyebrow")}
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight font-semibold tracking-[-0.035em]">
          {formatMessage("auth.merchant.login.title")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          {formatMessage("auth.merchant.login.description")}
        </p>
        <MerchantLoginForm />
        <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-5 text-stone-500">
          <Link
            className="text-orange-300 underline-offset-4 hover:underline"
            href="/login"
          >
            {formatMessage("auth.merchant.login.ownerLink")}
          </Link>
        </p>
      </section>
    </main>
  );
}
