import type { SupabaseClient } from "@supabase/supabase-js";

import {
  parsePlatformMerchant,
  type CreateMerchantInput,
  type PlatformMerchant,
} from "./platform-merchant";

const OPERATION_ERROR = "Merchant operation failed";

type RpcClient = {
  rpc(
    name: string,
    parameters?: Record<string, unknown>,
  ): Promise<{ data: unknown; error: unknown }>;
};

function parseRows(result: {
  data: unknown;
  error: unknown;
}): PlatformMerchant[] {
  if (result.error || !Array.isArray(result.data))
    throw new Error(OPERATION_ERROR);
  try {
    return result.data.map(parsePlatformMerchant);
  } catch {
    throw new Error(OPERATION_ERROR);
  }
}

export class SupabasePlatformMerchantRepository {
  constructor(private readonly client: RpcClient) {}

  async list(): Promise<PlatformMerchant[]> {
    return parseRows(await this.client.rpc("list_platform_merchants"));
  }

  async create(input: CreateMerchantInput): Promise<PlatformMerchant> {
    const rows = parseRows(
      await this.client.rpc("create_platform_merchant", {
        p_currency_code: input.currencyCode,
        p_name: input.name,
        p_owner_email: input.ownerEmail,
        p_timezone: input.timezone,
      }),
    );
    if (rows.length !== 1) throw new Error(OPERATION_ERROR);
    return rows[0]!;
  }
}

export function createSupabasePlatformMerchantRepository(
  client: SupabaseClient,
) {
  return new SupabasePlatformMerchantRepository(client as unknown as RpcClient);
}
