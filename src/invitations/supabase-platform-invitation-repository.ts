import type { SupabaseClient } from "@supabase/supabase-js";

import type { InvitationTarget } from "./platform-invitation";
import { z } from "zod";

const OPERATION_ERROR = "Invitation operation failed";
const PROVIDER_CODE_PATTERN = /^[A-Z0-9_]{1,16}$/u;

export class InvitationOperationError extends Error {
  readonly providerCode?: string;

  constructor(providerCode?: unknown) {
    super(OPERATION_ERROR);
    this.name = "InvitationOperationError";
    this.providerCode =
      typeof providerCode === "string" &&
      PROVIDER_CODE_PATTERN.test(providerCode.toUpperCase())
        ? providerCode.toUpperCase()
        : undefined;
  }
}

function providerCode(error: unknown): unknown {
  return error && typeof error === "object" && "code" in error
    ? error.code
    : undefined;
}

type RpcClient = {
  rpc(
    name: string,
    parameters: Record<string, unknown>,
  ): Promise<{ data: unknown; error: unknown }>;
};

const inspectionRowSchema = z
  .object({
    business_name: z.string().min(1).max(120),
    invitation_status: z.literal("issued"),
    expires_at: z.iso.datetime({ offset: true }),
  })
  .strict();

export type InvitationInspection = Readonly<{
  businessName: string;
  expiresAt: string;
}>;

const redemptionRowSchema = z
  .object({
    business_id: z.uuid(),
    membership_role: z.literal("merchant_owner"),
  })
  .strict();

function requireOneRow(result: { data: unknown; error: unknown }): void {
  if (result.error || !Array.isArray(result.data) || result.data.length !== 1) {
    throw new InvitationOperationError(providerCode(result.error));
  }
}

export class SupabasePlatformInvitationRepository {
  constructor(private readonly client: RpcClient) {}

  async issue(
    input: InvitationTarget & { tokenHash: string; expiresAt: string },
  ): Promise<void> {
    requireOneRow(
      await this.client.rpc("issue_platform_merchant_invitation", {
        p_business_id: input.businessId,
        p_expires_at: input.expiresAt,
        p_token_hash_hex: input.tokenHash,
      }),
    );
  }

  async revoke(input: InvitationTarget): Promise<void> {
    requireOneRow(
      await this.client.rpc("revoke_platform_merchant_invitation", {
        p_business_id: input.businessId,
      }),
    );
  }

  async inspect(tokenHash: string): Promise<InvitationInspection | null> {
    const result = await this.client.rpc("inspect_merchant_invitation", {
      p_token_hash_hex: tokenHash,
    });
    if (result.error || !Array.isArray(result.data))
      throw new InvitationOperationError(providerCode(result.error));
    if (result.data.length === 0) return null;
    if (result.data.length !== 1) throw new Error(OPERATION_ERROR);
    try {
      const row = inspectionRowSchema.parse(result.data[0]);
      return { businessName: row.business_name, expiresAt: row.expires_at };
    } catch {
      throw new Error(OPERATION_ERROR);
    }
  }

  async redeem(tokenHash: string, sessionTokenHash: string) {
    const result = await this.client.rpc("redeem_merchant_invitation", {
      p_session_token_hash: sessionTokenHash,
      p_token_hash_hex: tokenHash,
    });
    if (result.error || !Array.isArray(result.data) || result.data.length !== 1)
      throw new InvitationOperationError(providerCode(result.error));
    try {
      const row = redemptionRowSchema.parse(result.data[0]);
      return {
        businessId: row.business_id,
        role: row.membership_role,
      } as const;
    } catch {
      throw new InvitationOperationError();
    }
  }
}

export function createSupabasePlatformInvitationRepository(
  client: SupabaseClient,
) {
  return new SupabasePlatformInvitationRepository(
    client as unknown as RpcClient,
  );
}
