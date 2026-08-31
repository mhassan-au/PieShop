import type { ApplicationEnvironment } from "@/config/env";
import type { CookieMethodsServer, CookieOptions } from "@supabase/ssr";

type CookieEnvironment = ApplicationEnvironment["APP_ENV"];

type ServerCookieStore = {
  getAll(): Array<{ name: string; value: string }>;
  set(
    name: string,
    value: string,
    options: {
      expires?: Date;
      httpOnly: true;
      maxAge?: number;
      path: "/";
      sameSite: "lax";
      secure: boolean;
    },
  ): void;
};

function requiresSecureTransport(environment: CookieEnvironment): boolean {
  return environment !== "local" && environment !== "test";
}

export function hardenSupabaseServerCookieOptions(
  options: CookieOptions,
  environment: CookieEnvironment,
) {
  return {
    ...(options.expires instanceof Date ? { expires: options.expires } : {}),
    ...(typeof options.maxAge === "number" ? { maxAge: options.maxAge } : {}),
    httpOnly: true as const,
    path: "/" as const,
    sameSite: "lax" as const,
    secure: requiresSecureTransport(environment),
  };
}

export function createSupabaseServerCookieMethods(
  store: ServerCookieStore,
  environment: CookieEnvironment,
  setResponseHeaders?: (headers: Record<string, string>) => void,
): CookieMethodsServer {
  return {
    getAll: () => store.getAll(),
    setAll: (cookies, headers) => {
      for (const cookie of cookies) {
        const options = cookie.options as CookieOptions;
        store.set(
          cookie.name,
          cookie.value,
          hardenSupabaseServerCookieOptions(options, environment),
        );
      }

      setResponseHeaders?.(headers);
    },
  };
}
