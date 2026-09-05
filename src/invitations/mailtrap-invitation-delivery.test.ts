import { describe, expect, it, vi } from "vitest";
import { parseEnvironment } from "@/config/env";
import { MailtrapInvitationDelivery } from "./mailtrap-invitation-delivery";

const environment = parseEnvironment({
  APP_ENV: "test",
  APP_BASE_URL: "http://localhost:3000",
  MAILTRAP_SMTP_HOST: "sandbox.smtp.mailtrap.io",
  MAILTRAP_SMTP_PORT: "2525",
  MAILTRAP_SMTP_USERNAME: "synthetic-user",
  MAILTRAP_SMTP_PASSWORD: "synthetic-password",
  MAIL_FROM_EMAIL: "no-reply@pieshop.test",
  MAIL_FROM_NAME: "PieShop",
});

describe("MailtrapInvitationDelivery", () => {
  it("sends one escaped sandbox message through an injected transport", async () => {
    const sendMail = vi.fn().mockResolvedValue({ accepted: true });
    const delivery = new MailtrapInvitationDelivery(sendMail, environment);
    await delivery.send({
      recipientEmail: "merchant@example.test",
      businessName: "Pies <script>",
      invitationUrl: "http://localhost:3000/invite/synthetic-token",
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { address: "no-reply@pieshop.test", name: "PieShop" },
        to: "merchant@example.test",
        subject: "Your PieShop merchant invitation",
        html: expect.not.stringContaining("<script>"),
      }),
    );
  });

  it("redacts SMTP errors", async () => {
    const delivery = new MailtrapInvitationDelivery(
      vi.fn().mockRejectedValue(new Error("smtp password leaked")),
      environment,
    );
    await expect(
      delivery.send({
        recipientEmail: "merchant@example.test",
        businessName: "Pies",
        invitationUrl: "http://localhost:3000/invite/token",
      }),
    ).rejects.toThrow("Invitation delivery failed");
    await expect(
      delivery.send({
        recipientEmail: "merchant@example.test",
        businessName: "Pies",
        invitationUrl: "http://localhost:3000/invite/token",
      }),
    ).rejects.not.toThrow("smtp password leaked");
  });
});
