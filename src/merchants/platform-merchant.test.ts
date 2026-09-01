import { describe, expect, it } from "vitest";

import {
  parseCreateMerchantInput,
  parsePlatformMerchant,
} from "./platform-merchant";

describe("platform merchant metadata boundary", () => {
  it("normalizes the owner-controlled create fields", () => {
    expect(
      parseCreateMerchantInput({
        name: "  Example Pies  ",
        ownerEmail: " OWNER@EXAMPLE.TEST ",
        timezone: "Australia/Sydney",
        currencyCode: "AUD",
      }),
    ).toEqual({
      name: "Example Pies",
      ownerEmail: "owner@example.test",
      timezone: "Australia/Sydney",
      currencyCode: "AUD",
    });
  });

  it.each([
    {
      name: "",
      ownerEmail: "owner@example.test",
      timezone: "Australia/Sydney",
      currencyCode: "AUD",
    },
    {
      name: "Example",
      ownerEmail: "invalid",
      timezone: "Australia/Sydney",
      currencyCode: "AUD",
    },
    {
      name: "Example",
      ownerEmail: "owner@example.test",
      timezone: "Not/AZone",
      currencyCode: "AUD",
    },
    {
      name: "Example",
      ownerEmail: "owner@example.test",
      timezone: "Australia/Sydney",
      currencyCode: "USD",
    },
    {
      name: "Example",
      ownerEmail: "owner@example.test",
      timezone: "Australia/Sydney",
      currencyCode: "AUD",
      status: "active",
    },
  ])("rejects invalid or mass-assigned create input %#", (input) => {
    expect(() => parseCreateMerchantInput(input)).toThrow();
  });

  it("returns only allow-listed operational metadata", () => {
    const merchant = parsePlatformMerchant({
      id: "11111111-1111-4111-8111-111111111111",
      public_id: "biz_12345678",
      name: "Example Pies",
      status: "onboarding",
      timezone: "Australia/Sydney",
      currency_code: "AUD",
      invitation_status: "draft",
      created_at: "2026-09-01T00:00:00.000Z",
      updated_at: "2026-09-01T00:00:00.000Z",
    });

    expect(merchant).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      publicId: "biz_12345678",
      name: "Example Pies",
      status: "onboarding",
      timezone: "Australia/Sydney",
      currencyCode: "AUD",
      invitationStatus: "draft",
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    });
  });

  it("accepts approved lifecycle states from existing merchants", () => {
    expect(
      parsePlatformMerchant({
        id: "11111111-1111-4111-8111-111111111111",
        public_id: "biz_12345678",
        name: "Existing Merchant",
        status: "active",
        timezone: "Australia/Sydney",
        currency_code: "AUD",
        invitation_status: "draft",
        created_at: "2026-09-01T00:00:00.000Z",
        updated_at: "2026-09-01T00:00:00.000Z",
      }).status,
    ).toBe("active");
  });

  it.each([
    "catalogue",
    "transaction",
    "payment",
    "bank",
    "customer",
    "address",
    "message",
    "order",
  ])(
    "rejects forbidden %s content even when metadata is otherwise valid",
    (field) => {
      expect(() =>
        parsePlatformMerchant({
          id: "11111111-1111-4111-8111-111111111111",
          public_id: "biz_12345678",
          name: "Example Pies",
          status: "onboarding",
          timezone: "Australia/Sydney",
          currency_code: "AUD",
          invitation_status: "draft",
          created_at: "2026-09-01T00:00:00.000Z",
          updated_at: "2026-09-01T00:00:00.000Z",
          [field]: "forbidden",
        }),
      ).toThrow();
    },
  );
});
