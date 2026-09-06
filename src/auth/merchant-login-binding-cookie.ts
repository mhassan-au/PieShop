import { createHash } from "node:crypto";

import type { ApplicationEnvironment } from "@/config/env";

const LOCAL_NAME = "pieshop_merchant_login_binding";
const SECURE_NAME = "__Host-pieshop_merchant_login_binding";
export const MERCHANT_LOGIN_BINDING_MAX_AGE_SECONDS = 15 * 60;
const HASH_PATTERN = /^[0-9a-f]{64}$/u;

type Store = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: Record<string, unknown>): void;
};

const isLocal = (env: ApplicationEnvironment["APP_ENV"]) =>
  env === "local" || env === "test";
const nameFor = (env: ApplicationEnvironment["APP_ENV"]) =>
  isLocal(env) ? LOCAL_NAME : SECURE_NAME;
const optionsFor = (
  env: ApplicationEnvironment["APP_ENV"],
  maxAge: number,
) => ({
  httpOnly: true as const,
  maxAge,
  path: "/" as const,
  priority: "high" as const,
  sameSite: "lax" as const,
  secure: !isLocal(env),
});

export function hashMerchantLoginIdentity(email: string): string {
  return createHash("sha256")
    .update(email.trim().toLowerCase(), "utf8")
    .digest("hex");
}

export function setMerchantLoginBindingCookie(
  store: Store,
  hash: string,
  env: ApplicationEnvironment["APP_ENV"],
) {
  if (!HASH_PATTERN.test(hash))
    throw new Error("Invalid merchant login binding");
  store.set(
    nameFor(env),
    hash,
    optionsFor(env, MERCHANT_LOGIN_BINDING_MAX_AGE_SECONDS),
  );
}

export function readMerchantLoginBindingCookie(
  store: Pick<Store, "get">,
  env: ApplicationEnvironment["APP_ENV"],
) {
  const value = store.get(nameFor(env))?.value;
  return value && HASH_PATTERN.test(value) ? value : null;
}

export function clearMerchantLoginBindingCookie(
  store: Store,
  env: ApplicationEnvironment["APP_ENV"],
) {
  store.set(nameFor(env), "", optionsFor(env, 0));
}
