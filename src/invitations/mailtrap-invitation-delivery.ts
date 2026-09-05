import nodemailer from "nodemailer";

import type { ApplicationEnvironment } from "@/config/env";

const DELIVERY_ERROR = "Invitation delivery failed";

type SendMail = (message: {
  from: { address: string; name: string };
  to: string;
  subject: string;
  text: string;
  html: string;
}) => Promise<unknown>;

export type InvitationDelivery = Readonly<{
  recipientEmail: string;
  businessName: string;
  invitationUrl: string;
}>;

export class MailtrapInvitationDelivery {
  constructor(
    private readonly sendMail: SendMail,
    private readonly environment: ApplicationEnvironment,
  ) {}

  async send(input: InvitationDelivery): Promise<void> {
    const fromAddress = this.environment.MAIL_FROM_EMAIL;
    const fromName = this.environment.MAIL_FROM_NAME;
    if (!fromAddress || !fromName) throw new Error(DELIVERY_ERROR);
    try {
      await this.sendMail({
        from: { address: fromAddress, name: fromName },
        to: input.recipientEmail,
        subject: "Your PieShop merchant invitation",
        text: `You have been invited to manage ${input.businessName}. Open this single-use link: ${input.invitationUrl}`,
        html: `<p>You have been invited to manage ${escapeHtml(input.businessName)}.</p><p><a href="${escapeHtml(input.invitationUrl)}">Review invitation</a></p>`,
      });
    } catch {
      throw new Error(DELIVERY_ERROR);
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createMailtrapInvitationDelivery(
  environment: ApplicationEnvironment,
): MailtrapInvitationDelivery {
  if (
    (environment.APP_ENV !== "local" && environment.APP_ENV !== "test") ||
    !environment.MAILTRAP_SMTP_HOST ||
    !environment.MAILTRAP_SMTP_PORT ||
    !environment.MAILTRAP_SMTP_USERNAME ||
    !environment.MAILTRAP_SMTP_PASSWORD
  )
    throw new Error(DELIVERY_ERROR);
  const transport = nodemailer.createTransport({
    host: environment.MAILTRAP_SMTP_HOST,
    port: environment.MAILTRAP_SMTP_PORT,
    secure: false,
    auth: {
      user: environment.MAILTRAP_SMTP_USERNAME,
      pass: environment.MAILTRAP_SMTP_PASSWORD,
    },
  });
  return new MailtrapInvitationDelivery(
    (message) => transport.sendMail(message),
    environment,
  );
}
