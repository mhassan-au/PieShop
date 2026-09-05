import nodemailer from "nodemailer";

const required = [
  "MAILTRAP_SMTP_HOST",
  "MAILTRAP_SMTP_PORT",
  "MAILTRAP_SMTP_USERNAME",
  "MAILTRAP_SMTP_PASSWORD",
  "MAIL_FROM_EMAIL",
  "MAIL_FROM_NAME",
];

try {
  if (process.env.APP_ENV !== "local" && process.env.APP_ENV !== "test") {
    throw new Error("unsafe environment");
  }
  if (required.some((name) => !process.env[name])) {
    throw new Error("incomplete configuration");
  }
  if (process.env.MAILTRAP_SMTP_HOST !== "sandbox.smtp.mailtrap.io") {
    throw new Error("non-sandbox SMTP host");
  }
  const port = Number(process.env.MAILTRAP_SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("invalid port");
  }

  const transport = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port,
    secure: false,
    auth: {
      user: process.env.MAILTRAP_SMTP_USERNAME,
      pass: process.env.MAILTRAP_SMTP_PASSWORD,
    },
  });

  await transport.verify();
  await transport.sendMail({
    from: {
      address: process.env.MAIL_FROM_EMAIL,
      name: process.env.MAIL_FROM_NAME,
    },
    to: "merchant-owner@example.test",
    subject: "PieShop sandbox connection test",
    text: "Synthetic development message. No account or invitation was created.",
  });
  console.log("Mailtrap sandbox check passed: one synthetic message captured.");
} catch {
  console.error(
    "Mailtrap sandbox check failed: verify local sandbox configuration.",
  );
  process.exitCode = 1;
}
