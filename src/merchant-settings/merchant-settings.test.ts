import { describe, expect, it } from "vitest";
import {
  deriveSetupState,
  parseMerchantSettingsRow,
  parseMerchantSettingsUpdate,
} from "./merchant-settings";

describe("merchant settings", () => {
  it("normalizes the locked synthetic settings input", () => {
    expect(
      parseMerchantSettingsUpdate({
        businessName: "  Harbour Pies  ",
        contactEmail: "  TEST@EXAMPLE.COM ",
        contactPhone: "+61 412 345 678",
        currencyCode: "AUD",
        timezone: "Australia/Sydney",
        version: 2,
      }),
    ).toEqual({
      businessName: "Harbour Pies",
      contactEmail: "test@example.com",
      contactPhone: "+61412345678",
      currencyCode: "AUD",
      timezone: "Australia/Sydney",
      version: 2,
    });
  });

  it.each([
    {
      businessName: "",
      contactEmail: "test@example.com",
      contactPhone: "+61412345678",
      currencyCode: "AUD",
      timezone: "Australia/Sydney",
      version: 1,
    },
    {
      businessName: "Pies",
      contactEmail: "bad",
      contactPhone: "+61412345678",
      currencyCode: "AUD",
      timezone: "Australia/Sydney",
      version: 1,
    },
    {
      businessName: "Pies",
      contactEmail: "test@example.com",
      contactPhone: "0412",
      currencyCode: "AUD",
      timezone: "Australia/Sydney",
      version: 1,
    },
    {
      businessName: "Pies",
      contactEmail: "test@example.com",
      contactPhone: "+61412345678",
      currencyCode: "USD",
      timezone: "Australia/Sydney",
      version: 1,
    },
    {
      businessName: "Pies",
      contactEmail: "test@example.com",
      contactPhone: "+61412345678",
      currencyCode: "AUD",
      timezone: "Not/AZone",
      version: 1,
    },
    {
      businessName: "Pies",
      contactEmail: "test@example.com",
      contactPhone: "+61412345678",
      currencyCode: "AUD",
      timezone: "Australia/Sydney",
      version: 1,
      businessId: "attacker",
    },
  ])("rejects invalid or mass-assigned input", (input) => {
    expect(() => parseMerchantSettingsUpdate(input)).toThrow();
  });

  it("derives resumable progress instead of accepting a percentage", () => {
    expect(
      deriveSetupState({
        businessName: "Harbour Pies",
        contactEmail: "test@example.com",
        contactPhone: null,
        currencyCode: "AUD",
        timezone: "Australia/Sydney",
      }),
    ).toEqual({ completed: 3, total: 4, percent: 75, next: "contact" });
  });

  it("allow-lists database output and rejects provider additions", () => {
    const row = {
      business_id: "123e4567-e89b-12d3-a456-426614174000",
      business_name: "Harbour Pies",
      contact_email: null,
      contact_phone: null,
      currency_code: "AUD",
      timezone: "Australia/Sydney",
      version: 1,
      updated_at: "2026-09-06T00:00:00.000Z",
    };
    expect(parseMerchantSettingsRow(row).businessName).toBe("Harbour Pies");
    expect(() =>
      parseMerchantSettingsRow({ ...row, secret: "leak" }),
    ).toThrow();
  });
});
