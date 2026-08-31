import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { hardenSupabaseServerCookieOptions } from "@/auth/supabase-server-cookie-policy";
import { loadEnvironment } from "@/config/env";

export async function proxy(request: NextRequest) {
  const environment = loadEnvironment(process.env);
  const supabaseUrl = environment.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return new NextResponse(null, { status: 503 });
  }

  let response = NextResponse.next({ request });
  const client = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies, headers) => {
        for (const cookie of cookies) {
          request.cookies.set(cookie.name, cookie.value);
        }
        response = NextResponse.next({ request });
        for (const cookie of cookies) {
          response.cookies.set(
            cookie.name,
            cookie.value,
            hardenSupabaseServerCookieOptions(
              cookie.options,
              environment.APP_ENV,
            ),
          );
        }

        for (const [name, value] of Object.entries(headers)) {
          response.headers.set(name, value);
        }
      },
    },
  });

  try {
    await client.auth.getUser();
  } catch {
    // The authoritative route guard handles provider availability and denial.
  }
  return response;
}

export const config = {
  matcher: ["/control/:path*"],
};
