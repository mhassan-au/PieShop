import type { ApplicationEnvironment } from "@/config/env";

const LOCAL_NAME = "pieshop_invitation_binding";
const SECURE_NAME = "__Host-pieshop_invitation_binding";
export const INVITATION_BINDING_MAX_AGE_SECONDS = 15 * 60;
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

export function setInvitationBindingCookie(
  store: Store,
  hash: string,
  env: ApplicationEnvironment["APP_ENV"],
) {
  if (!HASH_PATTERN.test(hash)) throw new Error("Invalid invitation binding");
  store.set(
    nameFor(env),
    hash,
    optionsFor(env, INVITATION_BINDING_MAX_AGE_SECONDS),
  );
}

export function readInvitationBindingCookie(
  store: Pick<Store, "get">,
  env: ApplicationEnvironment["APP_ENV"],
) {
  const value = store.get(nameFor(env))?.value;
  return value && HASH_PATTERN.test(value) ? value : null;
}

export function clearInvitationBindingCookie(
  store: Store,
  env: ApplicationEnvironment["APP_ENV"],
) {
  store.set(nameFor(env), "", optionsFor(env, 0));
}
