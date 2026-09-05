import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { readInvitationDeliveryTarget } from "./supabase-invitation-delivery-target";

const businessId = "11111111-1111-4111-8111-111111111111";

function clientWith(result: unknown) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { client: { rpc }, rpc };
}

describe("invitation delivery target", () => {
  it("reads one minimal recipient record for the selected merchant", async () => {
    const query = clientWith({
      data: [
        {
          recipient_email: "merchant@example.test",
          business_name: "Example Pies",
        },
      ],
      error: null,
    });

    await expect(
      readInvitationDeliveryTarget(query.client as never, businessId),
    ).resolves.toEqual({
      recipientEmail: "merchant@example.test",
      businessName: "Example Pies",
    });
    expect(query.rpc).toHaveBeenCalledWith(
      "get_server_invitation_delivery_target",
      { p_business_id: businessId },
    );
  });

  it("fails closed without exposing provider details", async () => {
    const query = clientWith({
      data: null,
      error: { message: "recipient and secret details" },
    });
    await expect(
      readInvitationDeliveryTarget(query.client as never, businessId),
    ).rejects.toThrow("Invitation delivery target unavailable");
    await expect(
      readInvitationDeliveryTarget(query.client as never, businessId),
    ).rejects.not.toThrow("recipient and secret details");
  });
});
