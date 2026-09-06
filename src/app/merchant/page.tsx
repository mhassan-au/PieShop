import { redirect } from "next/navigation";

import { verifyRequestMerchantAccess } from "@/auth/merchant-request-access";
import { formatMessage } from "@/messages/catalogue";
import { merchantLogoutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MerchantPage() {
  const access = await verifyRequestMerchantAccess();
  if (!access) redirect("/merchant/login");
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-12">
      <section className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <form action={merchantLogoutAction} className="float-right">
          <button className="min-h-11 rounded-xl border border-white/20 px-4 text-sm font-semibold">
            {formatMessage("auth.merchant.logout.submit")}
          </button>
        </form>
        <p className="text-xs font-bold tracking-[0.2em] text-orange-300 uppercase">
          {formatMessage("merchant.home.eyebrow")}
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold">
          {formatMessage("merchant.home.title")}
        </h1>
        <p className="mt-4 text-stone-300">
          {formatMessage("merchant.home.description")}
        </p>
      </section>
    </main>
  );
}
