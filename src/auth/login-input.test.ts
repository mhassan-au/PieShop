import { describe, expect, it } from "vitest";

import { AppError } from "@/errors/app-error";

import { parseOwnerLoginInput } from "./login-input";

describe("parseOwnerLoginInput", () => {
  it("normalizes an email while preserving the password exactly", () => {
    expect(
      parseOwnerLoginInput({
        email: "  OWNER.Example@Example.COM ",
        password: "  deliberate surrounding spaces  ",
      }),
    ).toEqual({
      email: "owner.example@example.com",
      password: "  deliberate surrounding spaces  ",
    });
  });

  it.each([
    undefined,
    null,
    {},
    { email: "not-an-email", password: "secret" },
    { email: "owner@example.com", password: "" },
    { email: `${"a".repeat(245)}@example.com`, password: "secret" },
    { email: "owner@example.com", password: "x".repeat(1025) },
    { email: "owner@example.com", password: "secret", role: "platform_owner" },
  ])("rejects malformed or mass-assigned input safely", (input) => {
    expect.assertions(4);

    try {
      parseOwnerLoginInput(input);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("VALIDATION_FAILED");
      expect((error as AppError).publicMessageKey).toBe(
        "validation.auth.credentials",
      );
      expect(JSON.stringify(error)).not.toContain("secret");
    }
  });
});
