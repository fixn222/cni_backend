import { Resend } from "resend";

const getRequiredEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const isProduction = process.env.NODE_ENV === "production";

let resendClient: Resend | null = null;

const getResendClient = () => {
  if (!resendClient) {
    resendClient = new Resend(getRequiredEnv("RESEND_API_KEY"));
  }

  return resendClient;
};

const getFromAddress = () =>
  process.env.MAIL_FROM ?? "CNI Global <noreply@example.com>";

const hasConfiguredResend = () =>
  Boolean(
    process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY !== "re_replace_me" &&
      getFromAddress()
  );

const shouldSkipExternalEmail = () => !isProduction && !hasConfiguredResend();

const logEmailPreview = ({
  to,
  subject,
  reason,
}: {
  to: string[];
  subject: string;
  reason: string;
}) => {
  console.warn(
    `[mailer] ${reason}. Email not sent. to=${to.join(", ")} subject="${subject}"`
  );
};

const getEmailErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown email provider error";
};

const sendEmail = async ({
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string | string[];
}) => {
  const recipients = Array.isArray(to) ? to : [to];
  const from = getFromAddress();

  if (shouldSkipExternalEmail()) {
    logEmailPreview({
      to: recipients,
      subject,
      reason:
        "Development email preview is active because Resend is not configured",
    });
    return;
  }

  if (!hasConfiguredResend()) {
    throw new Error(
      "Email delivery failed. Set RESEND_API_KEY and MAIL_FROM to send email with Resend."
    );
  }

  try {
    const result = await getResendClient().emails.send({
      from,
      to: recipients,
      subject,
      text,
      html,
      replyTo,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  } catch (error) {
    const message = getEmailErrorMessage(error);

    throw new Error(
      `Email delivery failed. Check RESEND_API_KEY and MAIL_FROM. Provider error: ${message}`
    );
  }
};

const buildEmailLayout = ({
  heading,
  intro,
  actionLabel,
  actionUrl,
  footer,
}: {
  heading: string;
  intro: string;
  actionLabel: string;
  actionUrl: string;
  footer: string;
}) => ({
  text: `${heading}

${intro}

${actionLabel}: ${actionUrl}

${footer}`,
  html: `
    <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.18em; color: #0f766e; font-weight: 700;">
          CNI GLOBAL
        </p>
        <h1 style="margin: 0 0 16px; font-size: 28px; line-height: 1.2; color: #0f172a;">
          ${heading}
        </h1>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #334155;">
          ${intro}
        </p>
        <a href="${actionUrl}" style="display: inline-block; background: #0f766e; color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 10px; font-weight: 700;">
          ${actionLabel}
        </a>
        <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.7; color: #64748b;">
          If the button does not work, open this link:<br />
          <a href="${actionUrl}" style="color: #0f766e; word-break: break-all;">${actionUrl}</a>
        </p>
        <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.7; color: #64748b;">
          ${footer}
        </p>
      </div>
    </div>
  `,
});

export const sendVerificationEmail = async ({
  to,
  name,
  url,
}: {
  to: string;
  name?: string | null;
  url: string;
}) => {
  const subject = "Verify your CNI Global account";
  const content = buildEmailLayout({
    heading: "Verify your email",
    intro: `Hi ${name ?? "there"}, please verify your email address to activate your CNI Global account and continue securely.`,
    actionLabel: "Verify email",
    actionUrl: url,
    footer:
      "If you did not create this account, you can ignore this email safely.",
  });

  await sendEmail({
    to,
    subject,
    text: content.text,
    html: content.html,
  });
};

export const sendResetPasswordEmail = async ({
  to,
  name,
  url,
}: {
  to: string;
  name?: string | null;
  url: string;
}) => {
  const subject = "Reset your CNI Global password";
  const content = buildEmailLayout({
    heading: "Reset your password",
    intro: `Hi ${name ?? "there"}, we received a request to reset your password. Use the link below to choose a new password.`,
    actionLabel: "Reset password",
    actionUrl: url,
    footer:
      "If you did not request a password reset, you can ignore this email and your account will stay unchanged.",
  });

  await sendEmail({
    to,
    subject,
    text: content.text,
    html: content.html,
  });
};

export const sendVerificationCodeEmail = async ({
  to,
  otp,
  type,
}: {
  to: string;
  otp: string;
  type: "email-verification" | "forget-password" | "sign-in" | "change-email";
}) => {
  const emailTypeCopy = {
    "email-verification": {
      subject: "Your CNI Global verification code",
      heading: "Verify your email",
      intro:
        "Use the code below to verify your email address and activate your account.",
    },
    "forget-password": {
      subject: "Your CNI Global password reset code",
      heading: "Reset your password",
      intro:
        "Use the code below to reset your password. If you did not request this, you can ignore this email.",
    },
    "sign-in": {
      subject: "Your CNI Global sign-in code",
      heading: "Complete sign in",
      intro: "Use the code below to complete your sign-in request.",
    },
    "change-email": {
      subject: "Your CNI Global email change code",
      heading: "Confirm your new email",
      intro: "Use the code below to confirm your email address change.",
    },
  } as const;

  const content = emailTypeCopy[type];

  await sendEmail({
    to,
    subject: content.subject,
    text: `${content.heading}

${content.intro}

Verification code: ${otp}

This code expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.18em; color: #0f766e; font-weight: 700;">
            CNI GLOBAL
          </p>
          <h1 style="margin: 0 0 16px; font-size: 28px; line-height: 1.2; color: #0f172a;">
            ${content.heading}
          </h1>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #334155;">
            ${content.intro}
          </p>
          <div style="display: inline-block; margin: 0 0 24px; padding: 16px 20px; border-radius: 12px; background: #ecfeff; border: 1px solid #99f6e4; font-size: 32px; font-weight: 700; letter-spacing: 0.35em; color: #0f172a;">
            ${otp}
          </div>
          <p style="margin: 0; font-size: 13px; line-height: 1.7; color: #64748b;">
            This code expires in 10 minutes.
          </p>
        </div>
      </div>
    `,
  });
};

export const sendApplicationConfirmationEmail = async ({
  to,
  name,
  countryName,
  applicationId,
}: {
  to: string;
  name?: string | null;
  countryName: string;
  applicationId: string;
}) => {
  const subject = "We received your visa application";
  const dashboardUrl =
    process.env.FRONT_END_URL ?? "http://localhost:5173";
  const content = buildEmailLayout({
    heading: "Application received",
    intro: `Hi ${name ?? "there"}, your visa application for ${countryName} was submitted successfully. Reference: ${applicationId}. Our team will review it and contact you with the next steps.`,
    actionLabel: "View your dashboard",
    actionUrl: dashboardUrl,
    footer: "Thank you for choosing CNI Global.",
  });

  await sendEmail({
    to,
    subject,
    text: content.text,
    html: content.html,
  });
};

export const sendAdminNewApplicationNotificationEmail = async ({
  to,
  applicantName,
  countryName,
  visaType,
}: {
  to: string;
  applicantName: string;
  countryName: string;
  visaType: string;
}) => {
  const subject = "New visa application submitted";
  const adminDashboardUrl =
    process.env.ADMIN_DASHBOARD_URL ??
    `${process.env.FRONT_END_URL ?? "http://localhost:5173"}/admin`;

  const content = buildEmailLayout({
    heading: "New application submitted",
    intro: `${applicantName} submitted a ${visaType} application for ${countryName}. Review the application details in the admin dashboard.`,
    actionLabel: "Open admin dashboard",
    actionUrl: adminDashboardUrl,
    footer: "This notification was sent automatically by the CNI Global backend.",
  });

  await sendEmail({
    to,
    subject,
    text: content.text,
    html: content.html,
  });
};

export const sendApplicationStatusUpdateEmail = async ({
  to,
  name,
  status,
  countryName,
}: {
  to: string;
  name?: string | null;
  status: string;
  countryName: string;
}) => {
  const dashboardUrl = process.env.FRONT_END_URL ?? "http://localhost:5173";
  const subject = `Your visa application is now ${status}`;
  const content = buildEmailLayout({
    heading: "Application status updated",
    intro: `Hi ${name ?? "there"}, your visa application for ${countryName} has been updated to ${status}.`,
    actionLabel: "Check application",
    actionUrl: dashboardUrl,
    footer: "Reply to this email if you need help from the CNI Global team.",
  });

  await sendEmail({
    to,
    subject,
    text: content.text,
    html: content.html,
  });
};

export const sendAdminClientEmail = async ({
  to,
  subject,
  message,
}: {
  to: string;
  subject: string;
  message: string;
}) => {
  const html = `
    <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.18em; color: #0f766e; font-weight: 700;">
          CNI GLOBAL
        </p>
        <h1 style="margin: 0 0 16px; font-size: 24px; line-height: 1.2; color: #0f172a;">
          ${subject}
        </h1>
        <div style="font-size: 16px; line-height: 1.7; color: #334155; white-space: pre-wrap;">${message}</div>
      </div>
    </div>
  `;

  await sendEmail({
    to,
    subject,
    text: message,
    html,
  });
};

export const sendUserMessageToAdminsEmail = async ({
  recipients,
  fromName,
  fromEmail,
  subject,
  message,
}: {
  recipients: string[];
  fromName?: string | null;
  fromEmail?: string | null;
  subject: string;
  message: string;
}) => {
  const html = `
    <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.18em; color: #0f766e; font-weight: 700;">
          CNI GLOBAL
        </p>
        <h1 style="margin: 0 0 16px; font-size: 24px; line-height: 1.2; color: #0f172a;">
          ${subject}
        </h1>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.7; color: #475569;">
          From: ${fromName ?? "Unknown sender"}${fromEmail ? ` (${fromEmail})` : ""}
        </p>
        <div style="font-size: 16px; line-height: 1.7; color: #334155; white-space: pre-wrap;">${message}</div>
      </div>
    </div>
  `;

  await sendEmail({
    to: recipients,
    subject,
    text: `From: ${fromName ?? "Unknown sender"}${fromEmail ? ` (${fromEmail})` : ""}

${message}`,
    html,
    replyTo: fromEmail ?? undefined,
  });
};
