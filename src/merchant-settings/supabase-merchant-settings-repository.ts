import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  parseMerchantSettingsRow,
  type MerchantSettingsUpdate,
} from "./merchant-settings";

const OPERATION_ERROR = "Merchant settings operation failed";
const CONFLICT_CODE = "40001";

export class MerchantSettingsConflictError extends Error {
  constructor() {
    super("Merchant settings conflict");
    this.name = "MerchantSettingsConflictError";
  }
}
const updateRowSchema = z
  .object({
    business_id: z.uuid(),
    version: z.number().int().positive(),
    updated_at: z.iso.datetime({ offset: true }),
  })
  .strict();

type RpcClient = {
  rpc(
    name: string,
    parameters: Record<string, unknown>,
  ): Promise<{ data: unknown; error: unknown }>;
};

function oneRow(data: unknown) {
  if (!Array.isArray(data) || data.length !== 1)
    throw new Error(OPERATION_ERROR);
  return data[0];
}

export class SupabaseMerchantSettingsRepository {
  constructor(private readonly client: RpcClient) {}

  async get(sessionTokenHash: string) {
    const result = await this.client.rpc("get_current_merchant_settings", {
      p_session_token_hash: sessionTokenHash,
    });
    if (result.error) throw new Error(OPERATION_ERROR);
    try {
      return parseMerchantSettingsRow(oneRow(result.data));
    } catch {
      throw new Error(OPERATION_ERROR);
    }
  }

  async update(input: MerchantSettingsUpdate, sessionTokenHash: string) {
    const result = await this.client.rpc("update_current_merchant_settings", {
      p_business_name: input.businessName,
      p_contact_email: input.contactEmail,
      p_contact_phone: input.contactPhone,
      p_currency_code: input.currencyCode,
      p_timezone: input.timezone,
      p_expected_version: input.version,
      p_session_token_hash: sessionTokenHash,
    });
    if (result.error) {
      if (
        typeof result.error === "object" &&
        result.error !== null &&
        "code" in result.error &&
        result.error.code === CONFLICT_CODE
      ) {
        throw new MerchantSettingsConflictError();
      }
      throw new Error(OPERATION_ERROR);
    }
    try {
      return updateRowSchema.parse(oneRow(result.data));
    } catch {
      throw new Error(OPERATION_ERROR);
    }
  }
}

export function createSupabaseMerchantSettingsRepository(
  client: SupabaseClient,
) {
  return new SupabaseMerchantSettingsRepository(client as unknown as RpcClient);
}
