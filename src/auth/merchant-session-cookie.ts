import type { ApplicationEnvironment } from "@/config/env";
import { parseSessionToken } from "./session-token";

const LOCAL_COOKIE_NAME = "pieshop_merchant_session";
const SECURE_COOKIE_NAME = "__Host-pieshop_merchant_session";
export const MERCHANT_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

type CookieEnvironment = ApplicationEnvironment["APP_ENV"];
type CookieOptions = Readonly<{
  httpOnly: true;
  maxAge: number;
  path: "/";
  priority: "high";
  sameSite: "lax";
  secure: boolean;
}>;
type ReadableCookieStore = { get(name: string): { value: string } | undefined };
type WritableCookieStore = ReadableCookieStore & {
  set(name: string, value: string, options: CookieOptions): void;
};

const isLocal = (environment: CookieEnvironment) =>
  environment === "local" || environment === "test";
const nameFor = (environment: CookieEnvironment) =>
  isLocal(environment) ? LOCAL_COOKIE_NAME : SECURE_COOKIE_NAME;
const optionsFor = (
  environment: CookieEnvironment,
  maxAge: number,
): CookieOptions => ({
  httpOnly: true,
  maxAge,
  path: "/",
  priority: "high",
  sameSite: "lax",
  secure: !isLocal(environment),
});

export function setMerchantSessionCookie(
  store: WritableCookieStore,
  token: string,
  environment: CookieEnvironment,
): void {
  const validToken = parseSessionToken(token);
  if (!validToken) throw new Error("Merchant session cookie value is invalid");
  store.set(
    nameFor(environment),
    validToken,
    optionsFor(environment, MERCHANT_SESSION_MAX_AGE_SECONDS),
  );
}

export function readMerchantSessionCookie(
  store: ReadableCookieStore,
  environment: CookieEnvironment,
): string | null {
  return parseSessionToken(store.get(nameFor(environment))?.value);
}

export function clearMerchantSessionCookie(
  store: WritableCookieStore,
  environment: CookieEnvironment,
): void {
  store.set(nameFor(environment), "", optionsFor(environment, 0));
}
