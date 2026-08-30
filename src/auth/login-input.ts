import { z } from "zod";

import { AppError } from "@/errors/app-error";

const ownerLoginInputSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(1).max(1024),
  })
  .strict();

export type OwnerLoginInput = z.infer<typeof ownerLoginInputSchema>;

export function parseOwnerLoginInput(input: unknown): OwnerLoginInput {
  const result = ownerLoginInputSchema.safeParse(input);

  if (!result.success) {
    throw new AppError({
      code: "VALIDATION_FAILED",
      publicMessageKey: "validation.auth.credentials",
      severity: "info",
      isRetryable: true,
    });
  }

  return result.data;
}
