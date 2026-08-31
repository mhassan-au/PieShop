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

export function createSupabaseServerCookieMethods(
  store: ServerCookieStore,
  environment: CookieEnvironment,
): CookieMethodsServer {
  return {
    getAll: () => store.getAll(),
    setAll: (cookies) => {
      for (const cookie of cookies) {
        const options = cookie.options as CookieOptions;
        const lifetime = {
          ...(options.expires instanceof Date
            ? { expires: options.expires }
            : {}),
          ...(typeof options.maxAge === "number"
            ? { maxAge: options.maxAge }
            : {}),
        };

        store.set(cookie.name, cookie.value, {
          ...lifetime,
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          secure: requiresSecureTransport(environment),
        });
      }
    },
  };
}
