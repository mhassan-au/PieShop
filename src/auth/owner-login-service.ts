import { parseOwnerLoginInput } from "./login-input";
import type { OwnerAuthProvider } from "./owner-auth-provider";
import {
  authorizePlatformOwner,
  type CurrentPlatformRoleRepository,
  type OwnerAssurancePolicy,
} from "./platform-owner-policy";
import {
  createOpaqueSessionCredential,
  type OpaqueSessionCredential,
} from "./session-token";

type OwnerSessionWriter = {
  create(tokenHash: string, deviceLabel: string | null): Promise<string>;
};

type OwnerLoginDependencies = Readonly<{
  authProvider: OwnerAuthProvider;
  roleRepository: CurrentPlatformRoleRepository;
  sessionRepository: OwnerSessionWriter;
  assurancePolicy: OwnerAssurancePolicy;
  createCredential?: () => Promise<OpaqueSessionCredential>;
}>;

export type OwnerLoginResult =
  | Readonly<{
      status: "authenticated";
      sessionId: string;
      sessionToken: string;
    }>
  | Readonly<{ status: "rejected" }>
  | Readonly<{ status: "unavailable" }>;

function normalizeDeviceLabel(value: string | null): string | null {
  if (value === null) return null;
  const safeValue = value
    .replace(/[\u0000-\u001f\u007f]/gu, "")
    .trim()
    .slice(0, 120);
  return safeValue || null;
}

async function terminateSafely(provider: OwnerAuthProvider): Promise<boolean> {
  try {
    await provider.terminateSession();
    return true;
  } catch {
    return false;
  }
}

export async function loginPlatformOwner(
  input: unknown,
  deviceLabel: string | null,
  dependencies: OwnerLoginDependencies,
): Promise<OwnerLoginResult> {
  const credentials = parseOwnerLoginInput(input);
  const authentication =
    await dependencies.authProvider.authenticate(credentials);

  if (authentication.status !== "authenticated") return authentication;

  const authorization = await authorizePlatformOwner({
    identity: authentication.identity,
    roleRepository: dependencies.roleRepository,
    assurancePolicy: dependencies.assurancePolicy,
  });

  if (authorization.status !== "authorized") {
    const terminated = await terminateSafely(dependencies.authProvider);
    if (!terminated || authorization.status === "unavailable") {
      return { status: "unavailable" };
    }
    return { status: "rejected" };
  }

  try {
    const credential = await (
      dependencies.createCredential ?? createOpaqueSessionCredential
    )();
    const sessionId = await dependencies.sessionRepository.create(
      credential.tokenHash,
      normalizeDeviceLabel(deviceLabel),
    );
    return {
      status: "authenticated",
      sessionId,
      sessionToken: credential.token,
    };
  } catch {
    await terminateSafely(dependencies.authProvider);
    return { status: "unavailable" };
  }
}
