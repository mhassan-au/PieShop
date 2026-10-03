import { createHash } from "node:crypto";

import type { ApplicationEnvironment } from "@/config/env";
import { OWNER_RECOVERY_GRANT_MAX_AGE_SECONDS } from "./owner-password-recovery";

const HASH_PATTERN = /^[0-9a-f]{64}$/u;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

type Store = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: Record<string, unknown>): void;
};

const local = (environment: ApplicationEnvironment["APP_ENV"]) =>
  environment === "local" || environment === "test";
const nameFor = (
  kind: "binding" | "grant",
  environment: ApplicationEnvironment["APP_ENV"],
) => `${local(environment) ? "" : "__Host-"}pieshop_owner_recovery_${kind}`;
const options = (
  environment: ApplicationEnvironment["APP_ENV"],
  maxAge: number,
) => ({
  httpOnly: true as const,
  maxAge,
  path: "/" as const,
  priority: "high" as const,
  sameSite: "lax" as const,
  secure: !local(environment),
});

export const hashOwnerRecoveryIdentity = (email: string) =>
  createHash("sha256").update(email.trim().toLowerCase(), "utf8").digest("hex");

export function setOwnerRecoveryBindingCookie(
  store: Store,
  hash: string,
  environment: ApplicationEnvironment["APP_ENV"],
) {
  if (!HASH_PATTERN.test(hash)) throw new Error("Invalid recovery binding");
  store.set(nameFor("binding", environment), hash, options(environment, 900));
}

export function readOwnerRecoveryBindingCookie(
  store: Pick<Store, "get">,
  environment: ApplicationEnvironment["APP_ENV"],
) {
  const value = store.get(nameFor("binding", environment))?.value;
  return value && HASH_PATTERN.test(value) ? value : null;
}

export function clearOwnerRecoveryBindingCookie(
  store: Store,
  environment: ApplicationEnvironment["APP_ENV"],
) {
  store.set(nameFor("binding", environment), "", options(environment, 0));
}

export function setOwnerRecoveryGrantCookie(
  store: Store,
  token: string,
  environment: ApplicationEnvironment["APP_ENV"],
) {
  if (!TOKEN_PATTERN.test(token)) throw new Error("Invalid recovery grant");
  store.set(
    nameFor("grant", environment),
    token,
    options(environment, OWNER_RECOVERY_GRANT_MAX_AGE_SECONDS),
  );
}

export function readOwnerRecoveryGrantCookie(
  store: Pick<Store, "get">,
  environment: ApplicationEnvironment["APP_ENV"],
) {
  const value = store.get(nameFor("grant", environment))?.value;
  return value && TOKEN_PATTERN.test(value) ? value : null;
}

export function clearOwnerRecoveryGrantCookie(
  store: Store,
  environment: ApplicationEnvironment["APP_ENV"],
) {
  store.set(nameFor("grant", environment), "", options(environment, 0));
}
