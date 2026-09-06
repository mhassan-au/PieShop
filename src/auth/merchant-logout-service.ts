import { hashSessionToken } from "./session-token";

type Dependencies = Readonly<{
  sessionRepository: {
    revokeCurrentByTokenHash(tokenHash: string): Promise<boolean>;
  };
  authProvider: { terminateSession(): Promise<void> };
}>;

export async function logoutMerchant(
  sessionToken: unknown,
  dependencies: Dependencies,
) {
  const tokenHash = await hashSessionToken(sessionToken);
  const operations: Promise<unknown>[] = [
    dependencies.authProvider.terminateSession(),
  ];
  if (tokenHash) {
    operations.push(
      dependencies.sessionRepository.revokeCurrentByTokenHash(tokenHash),
    );
  }
  const results = await Promise.allSettled(operations);
  return {
    status: results.some((result) => result.status === "rejected")
      ? ("unavailable" as const)
      : ("signed_out" as const),
  };
}
