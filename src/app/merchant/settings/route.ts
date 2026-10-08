import { NextResponse, type NextRequest } from "next/server";

import {
  updateMerchantSettingsAction,
  type MerchantSettingsActionState,
} from "@/app/merchant/actions";
import { formatMessage } from "@/messages/catalogue";

const initialState: MerchantSettingsActionState = { status: "idle" };

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin !== request.nextUrl.origin)
    return new NextResponse(null, { status: 403 });

  const state = await updateMerchantSettingsAction(
    initialState,
    await request.formData(),
  );
  const destination = new URL("/merchant", request.nextUrl.origin);
  const result =
    state.status === "success"
      ? "saved"
      : state.message === formatMessage("merchant.settings.update.conflict")
        ? "conflict"
        : "failed";
  destination.searchParams.set("settings", result);
  return NextResponse.redirect(destination, { status: 303 });
}
