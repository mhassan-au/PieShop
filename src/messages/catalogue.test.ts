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

  it.each([
    ["auth.owner.login.title", "Platform owner sign in"],
    ["auth.owner.login.email.label", "Email"],
    ["auth.owner.login.password.label", "Password"],
    ["auth.owner.login.submit", "Sign in"],
    ["auth.owner.login.submitting", "Signing in…"],
    ["auth.owner.login.eyebrow", "Private MVP access"],
    [
      "auth.owner.login.description",
      "Use the manually provisioned platform-owner account.",
    ],
    [
      "auth.owner.login.restriction",
      "No public registration or account recovery is available.",
    ],
    ["auth.owner.control.eyebrow", "Platform control plane"],
    ["auth.owner.control.title", "Merchant account administration"],
    ["auth.owner.logout.submit", "Sign out"],
    ["auth.owner.sessions.title", "Signed-in devices"],
    ["auth.owner.sessions.revoke", "Revoke session"],
    ["auth.owner.sessions.current", "Current session"],
    ["merchant.dashboard.title", "Merchants"],
    ["merchant.create.submit", "Create merchant"],
    ["merchant.create.invalid", "Check the merchant details and try again."],
    [
      "auth.owner.control.description",
      "Manage merchant account status and onboarding metadata without viewing merchant business content.",
    ],
    [
      "error.auth.invalidCredentials",
      "We couldn’t sign you in with those details.",
    ],
    [
      "error.auth.throttled",
      "We couldn’t sign you in right now. Wait a moment and try again.",
    ],
    [
      "validation.auth.credentials",
      "Enter a valid email address and password.",
    ],
  ] as const)("keeps authentication copy central for %s", (key, expected) => {
    expect(formatMessage(key)).toBe(expected);
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
