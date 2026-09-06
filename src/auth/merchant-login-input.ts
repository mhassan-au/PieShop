import { z } from "zod";

const schema = z.string().trim().toLowerCase().email().max(254);

export function parseMerchantLoginEmail(value: unknown): string | null {
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}
