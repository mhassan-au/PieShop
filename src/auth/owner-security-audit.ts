import type { createLogger } from "@/observability/logger";

export type OwnerSecurityEvent =
  | "auth.login.failed"
  | "auth.login.succeeded"
  | "auth.login.throttled"
  | "auth.login.unavailable"
  | "auth.authorization.denied"
  | "auth.session.denied"
  | "auth.access.unavailable";

export interface OwnerSecurityAudit {
  record(
    event: OwnerSecurityEvent,
    input: Readonly<{ outcome: string; actorId?: string }>,
  ): Promise<void>;
}

type Logger = ReturnType<typeof createLogger>;

export function createOwnerSecurityAudit(
  logger: Logger,
  requestId?: string,
): OwnerSecurityAudit {
  return {
    async record(event, input) {
      const logInput = {
        outcome: input.outcome,
        ...(requestId ? { requestId } : {}),
        securityRelevant: true,
        ...(input.actorId ? { context: { actorId: input.actorId } } : {}),
      };

      if (event === "auth.login.succeeded") {
        await logger.info(event, logInput);
      } else if (
        event === "auth.login.unavailable" ||
        event === "auth.access.unavailable"
      ) {
        await logger.error(event, logInput);
      } else {
        await logger.warn(event, logInput);
      }
    },
  };
}
