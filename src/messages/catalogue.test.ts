import { describe, expect, it } from "vitest";

import { formatMessage } from "./catalogue";

describe("formatMessage", () => {
  it("formats a known parameterised message", () => {
    expect(
      formatMessage("confirmation.order.submit", {
        customerName: "Sam & family",
      }),
    ).toBe("Confirm this order for Sam & family?");
  });

  it("formats a static message without parameters", () => {
    expect(formatMessage("validation.phone.invalid")).toBe(
      "Enter a valid phone number, including the area or country code.",
    );
  });

  it("rejects missing placeholders without echoing message data", () => {
    const unsafeFormatter = formatMessage as (
      key: string,
      parameters?: Record<string, unknown>,
    ) => string;

    expect(() => unsafeFormatter("confirmation.order.submit", {})).toThrow(
      "Message parameters do not match the catalogue definition",
    );
  });

  it("rejects unexpected or non-scalar parameters", () => {
    const unsafeFormatter = formatMessage as (
      key: string,
      parameters?: Record<string, unknown>,
    ) => string;

    expect(() =>
      unsafeFormatter("confirmation.order.submit", {
        customerName: { secret: "must-not-appear" },
      }),
    ).toThrow("Message parameters do not match the catalogue definition");
  });
});
