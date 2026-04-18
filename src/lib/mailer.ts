import nodemailer from "nodemailer" ;

const getRequiredEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const smtpSecure = process.env.SMTP_SECURE === "true";

const getTransporter = () =>
  nodemailer.createTransport({
    host: getRequiredEnv("SMTP_HOST"),
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: getRequiredEnv("SMTP_USER"),
      pass: getRequiredEnv("SMTP_PASS"),
    },
  });

const getFromAddress = () =>
  process.env.MAIL_FROM ??
  `CNI Global <${getRequiredEnv("SMTP_USER")}>`;

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

  await getTransporter().sendMail({
    from: getFromAddress(),
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

  await getTransporter().sendMail({
    from: getFromAddress(),
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
      intro:
        "Use the code below to complete your sign-in request.",
    },
    "change-email": {
      subject: "Your CNI Global email change code",
      heading: "Confirm your new email",
      intro:
        "Use the code below to confirm your email address change.",
    },
  } as const;

  const content = emailTypeCopy[type];

  await getTransporter().sendMail({
    from: getFromAddress(),
    to,
    subject: content.subject,
    text: `${content.heading}

${content.intro}

Verification code: ${otp}

This code will expire soon.`,
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
          <div style="display: inline-block; padding: 14px 18px; border-radius: 12px; background: #0f172a; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 0.35em;">
            ${otp}
          </div>
          <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.7; color: #64748b;">
            This code will expire soon.
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
  const subject = "Your Visa Application Has Been Submitted - CNI Global";
  const content = buildEmailLayout({
    heading: "Application Submitted Successfully",
    intro: `Hi ${name ?? "there"}, your visa application for ${countryName} has been successfully submitted. Our team will review your application and get back to you soon.`,
    actionLabel: "View Application",
    actionUrl: `${process.env.FRONT_END_URL}/dashboard/applications/${applicationId}`,
    footer: "If you have any questions, please contact our support team.",
  });

  await getTransporter().sendMail({
    from: getFromAddress(),
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
  await getTransporter().sendMail({
    from: getFromAddress(),
    to,
    subject: "New Visa Application Submitted",
    text: `A new visa application has been submitted.

Applicant: ${applicantName}
Country: ${countryName}
Visa Type: ${visaType}`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.18em; color: #0f766e; font-weight: 700;">
            CNI GLOBAL
          </p>
          <h1 style="margin: 0 0 16px; font-size: 28px; line-height: 1.2; color: #0f172a;">
            New Visa Application Submitted
          </h1>
          <p style="margin: 0 0 10px; font-size: 16px; line-height: 1.7; color: #334155;">
            A new application is ready for admin review.
          </p>
          <ul style="padding-left: 18px; margin: 16px 0 0; color: #334155; line-height: 1.8;">
            <li><strong>Applicant:</strong> ${applicantName}</li>
            <li><strong>Country:</strong> ${countryName}</li>
            <li><strong>Visa Type:</strong> ${visaType}</li>
          </ul>
        </div>
      </div>
    `,
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
  await getTransporter().sendMail({
    from: getFromAddress(),
    to,
    subject,
    text: message,
    html: `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.18em; color: #0f766e; font-weight: 700;">
            CNI GLOBAL
          </p>
          <h1 style="margin: 0 0 16px; font-size: 28px; line-height: 1.2; color: #0f172a;">
            ${subject}
          </h1>
          <div style="font-size: 16px; line-height: 1.8; color: #334155; white-space: pre-wrap;">${message}</div>
        </div>
      </div>
    `,
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
  status: "pending" | "approved" | "rejected";
  countryName: string;
}) => {
  const statusTitle =
    status === "approved"
      ? "Application approved"
      : status === "rejected"
        ? "Application update"
        : "Application moved to pending review";

  const intro = `Hi ${name ?? "there"}, your visa application for ${countryName} is now marked as ${status}. We will contact you for more details and guide you through the next steps.`;

  await getTransporter().sendMail({
    from: getFromAddress(),
    to,
    subject: `Your Visa Application Status: ${statusTitle}`,
    text: intro,
    html: `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.18em; color: #0f766e; font-weight: 700;">
            CNI GLOBAL
          </p>
          <h1 style="margin: 0 0 16px; font-size: 28px; line-height: 1.2; color: #0f172a;">
            ${statusTitle}
          </h1>
          <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #334155;">
            ${intro}
          </p>
        </div>
      </div>
    `,
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
  fromEmail: string;
  subject: string;
  message: string;
}) => {
  if (recipients.length === 0) {
    return;
  }

  await Promise.all(
    recipients.map((recipient) =>
      getTransporter().sendMail({
        from: getFromAddress(),
        to: recipient,
        subject: `Client Message: ${subject}`,
        text: `Client: ${fromName ?? "Unknown"}\nEmail: ${fromEmail}\n\n${message}`,
        html: `
          <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px;">
            <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.18em; color: #0f766e; font-weight: 700;">
                CNI GLOBAL
              </p>
              <h1 style="margin: 0 0 16px; font-size: 28px; line-height: 1.2; color: #0f172a;">
                Client Message: ${subject}
              </h1>
              <p style="margin: 0 0 10px; font-size: 16px; line-height: 1.8; color: #334155;">
                <strong>Client:</strong> ${fromName ?? "Unknown"}<br />
                <strong>Email:</strong> ${fromEmail}
              </p>
              <div style="font-size: 16px; line-height: 1.8; color: #334155; white-space: pre-wrap;">${message}</div>
            </div>
          </div>
        `,
      }),
    ),
  );
};
