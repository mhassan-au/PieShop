import type { ApplicationEnvironment } from "@/config/env";

import { parseSessionToken } from "./session-token";

const LOCAL_COOKIE_NAME = "pieshop_owner_session";
const SECURE_COOKIE_NAME = "__Host-pieshop_owner_session";

export const OWNER_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

type CookieEnvironment = ApplicationEnvironment["APP_ENV"];
type CookieOptions = Readonly<{
  httpOnly: true;
  maxAge: number;
  path: "/";
  priority: "high";
  sameSite: "lax";
  secure: boolean;
}>;

type ReadableCookieStore = {
  get(name: string): { value: string } | undefined;
};

type WritableCookieStore = ReadableCookieStore & {
  set(name: string, value: string, options: CookieOptions): void;
};

function isLocalHttpEnvironment(environment: CookieEnvironment): boolean {
  return environment === "local" || environment === "test";
}

function cookieName(environment: CookieEnvironment): string {
  return isLocalHttpEnvironment(environment)
    ? LOCAL_COOKIE_NAME
    : SECURE_COOKIE_NAME;
}

function cookieOptions(
  environment: CookieEnvironment,
  maxAge: number,
): CookieOptions {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    priority: "high",
    sameSite: "lax",
    secure: !isLocalHttpEnvironment(environment),
  };
}

export function setOwnerSessionCookie(
  store: WritableCookieStore,
  token: string,
  environment: CookieEnvironment,
): void {
  const validToken = parseSessionToken(token);
  if (!validToken) throw new Error("Owner session cookie value is invalid");

  store.set(
    cookieName(environment),
    validToken,
    cookieOptions(environment, OWNER_SESSION_MAX_AGE_SECONDS),
  );
}

export function readOwnerSessionCookie(
  store: ReadableCookieStore,
  environment: CookieEnvironment,
): string | null {
  return parseSessionToken(store.get(cookieName(environment))?.value);
}

export function clearOwnerSessionCookie(
  store: WritableCookieStore,
  environment: CookieEnvironment,
): void {
  store.set(cookieName(environment), "", cookieOptions(environment, 0));
}
