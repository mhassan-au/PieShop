import { describe, expect, it } from "vitest";

import { parseOwnerSessionRevocationInput } from "./owner-session-input";

describe("owner session revocation input", () => {
  it("accepts only the selected session identifier", () => {
    expect(
      parseOwnerSessionRevocationInput({
        sessionId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toEqual({ sessionId: "11111111-1111-4111-8111-111111111111" });
  });

  it.each([
    {},
    { sessionId: "session-1" },
    { sessionId: "11111111-1111-4111-8111-111111111111", userId: "other" },
  ])("rejects malformed or mass-assigned input %#", (input) => {
    expect(() => parseOwnerSessionRevocationInput(input)).toThrow(
      "Owner session revocation input is invalid",
    );
  });
});
