import { z } from "zod";

const schema = z
  .object({
    sessionId: z.uuid(),
  })
  .strict();

export function parseOwnerSessionRevocationInput(input: unknown): {
  sessionId: string;
} {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error("Owner session revocation input is invalid");
  }
  return result.data;
}
