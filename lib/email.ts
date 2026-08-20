import { render } from '@react-email/render';
import { InviteEmail } from '@/components/email/invite-email';
import { OtpCodeEmail } from '@/components/email/otp-code-email';
import { ResetPasswordEmail } from '@/components/email/reset-password-email';
import { VerificationEmail } from '@/components/email/verification-email';
import { WaitlistSignupNotificationEmail } from '@/components/email/waitlist-signup-notification-email';
import { WelcomeConfirmationEmail } from '@/components/email/welcome-confirmation-email';
import { resolveDefaultAppUrl, resolveLogoUrl, resolveSiteName } from '@/lib/email-branding';
import { buildInviteTextBody, buildWelcomeTextBody } from '@/lib/email/email-text-builders';
import { renderTemplateWithStoredOverrides } from '@/lib/system-email-templates';

type UserLike = {
  id: string;
  email: string;
  name?: string | null;
};

type VerificationPayload = {
  user: UserLike;
  url: string;
  token: string;
  request?: Request;
};

type ResetPayload = {
  user: UserLike;
  url: string;
  token: string;
  request?: Request;
};

type EmailOtpPayload = {
  email: string;
  otp: string;
  type: 'sign-in' | 'email-verification' | 'forget-password' | 'change-email';
};

type InvitePayload = {
  email: string;
  inviteUrl: string;
  siteName?: string;
  appUrl?: string;
  role?: 'user' | 'admin';
  roleName?: string;
  firstName?: string;
  invitedByName?: string;
  permissions?: string[];
  logoUrl?: string;
};

type WelcomeConfirmationPayload = {
  user: UserLike;
  roleName?: string;
  siteName?: string;
  appUrl?: string;
  logoUrl?: string;
  request?: Request;
};

const POSTMARK_API = 'https://api.postmarkapp.com/email';
const DEFAULT_INVITE_FROM_NAME = 'Admin Team';
const DEFAULT_WELCOME_FROM_NAME = 'The ASAP Global Team';
const DEFAULT_INVITE_PERMISSIONS: Record<'user' | 'admin', string[]> = {
  user: [
    'Share Research: Create and edit pages to make cutting-edge evidence accessible to the public.',
    'Showcase Global Impact: Upload media from our regional chapters across six continents.',
    'Drive the Narrative: Publish changes and write news articles that help shift the conversation around the causes of, and solutions to, global poverty.'
  ],
  admin: [
    'Share Research: Create and edit pages to make cutting-edge evidence accessible to the public.',
    'Showcase Global Impact: Upload media from our regional chapters across six continents.',
    'Drive the Narrative: Publish changes and write news articles that help shift the conversation around the causes of, and solutions to, global poverty.'
  ]
};

function normalizeNonEmpty(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed || '';
}

function normalizeBaseUrl(value: string | undefined | null) {
  const trimmed = normalizeNonEmpty(value);
  return trimmed.replace(/\/+$/, '');
}

function inferOrigin(value: string | undefined | null) {
  const trimmed = normalizeNonEmpty(value);
  if (!trimmed) return '';
  try {
    return new URL(trimmed).origin;
  } catch {
    return '';
  }
}

function formatRoleName(role: 'user' | 'admin') {
  if (role === 'admin') return 'Admin';
  return 'User';
}

function resolveInvitePermissions(role: 'user' | 'admin', permissions?: string[]) {
  const cleaned = (permissions || [])
    .map((permission) => permission.trim())
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length > 0 ? cleaned : DEFAULT_INVITE_PERMISSIONS[role];
}

function inferFirstNameFromEmail(email: string) {
  const localPart = (email.split('@')[0] || '').toLowerCase();
  const cleaned = localPart.replace(/[._-]+/g, ' ').replace(/\d+/g, ' ').trim();
  const [first = ''] = cleaned.split(/\s+/);
  if (!first) return 'there';
  return `${first.charAt(0).toUpperCase()}${first.slice(1)}`;
}

function inferFirstNameFromNameOrEmail(name: string | undefined | null, email: string) {
  const normalizedName = normalizeNonEmpty(name);
  if (normalizedName) {
    const [first = ''] = normalizedName.split(/\s+/);
    if (first) return first;
  }
  return inferFirstNameFromEmail(email);
}

function extractEmailAddress(from: string) {
  const trimmed = from.trim();
  const match = trimmed.match(/<([^>]+)>/);
  return (match?.[1] || trimmed).trim();
}

function formatFromAddress(from: string, fromName?: string) {
  const name = normalizeNonEmpty(fromName);
  if (!name) return from;
  const email = extractEmailAddress(from);
  return `${name} <${email}>`;
}

function resolveInviteAppUrl(payload: InvitePayload) {
  return (
    normalizeBaseUrl(payload.appUrl) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL) ||
    normalizeBaseUrl(process.env.PUBLIC_BASE_URL) ||
    normalizeBaseUrl(inferOrigin(payload.inviteUrl))
  );
}

function resolveWelcomeAppUrl(payload: WelcomeConfirmationPayload) {
  return (
    normalizeBaseUrl(payload.appUrl) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL) ||
    normalizeBaseUrl(process.env.PUBLIC_BASE_URL) ||
    normalizeBaseUrl(inferOrigin(payload.request?.url))
  );
}

function getPostmarkConfig() {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const from =
    process.env.POSTMARK_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    process.env.NEXT_PUBLIC_EMAIL_FROM ||
    'hello@example.com';
  return { token: token?.trim() || '', from: from.trim() };
}

function getContactRecipient() {
  const recipient =
    process.env.CONTACT_FORM_TO ||
    process.env.CONTACT_EMAIL ||
    process.env.POSTMARK_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    '';
  return recipient.trim();
}

async function sendPostmark(
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string,
  options?: { replyTo?: string; fromName?: string }
) {
  const { token, from } = getPostmarkConfig();
  if (!token || !from) {
    // Fall back to console logging when not configured.
    console.warn('[postmark] missing POSTMARK_SERVER_TOKEN or POSTMARK_FROM_EMAIL; logging instead');
    console.info({ to, subject, htmlBody, textBody, replyTo: options?.replyTo, fromName: options?.fromName });
    return;
  }

  const res = await fetch(POSTMARK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': token
    },
    body: JSON.stringify({
      From: formatFromAddress(from, options?.fromName),
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody,
      MessageStream: 'outbound',
      ReplyTo: options?.replyTo
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[postmark] send failed', res.status, body);
  }
}

export async function sendVerificationEmail(payload: VerificationPayload) {
  const recipientEmail = normalizeNonEmpty(payload.user.email).toLowerCase();
  const siteName = resolveSiteName();
  const appUrl = resolveDefaultAppUrl(payload.url);
  const logoUrl = resolveLogoUrl(undefined, appUrl);
  const greeting = payload.user.name ? `Hello ${payload.user.name},` : 'Hello,';
  const subject = `Verify your email for ${siteName}`;
  const htmlBody = await render(
    VerificationEmail({
      subject,
      greeting,
      verificationUrl: payload.url,
      siteName,
      appUrl,
      logoUrl
    })
  );
  const textBody = [
    greeting,
    '',
    'To complete your setup and access the Academics Stand Against Poverty platform, please verify your email address by clicking the link below:',
    '',
    payload.url,
    '',
    'If you did not request this, you can safely ignore this email.',
    '',
    'Best,',
    'The ASAP Global Team',
    siteName
  ].join('\n');

  const resolvedTemplate = await renderTemplateWithStoredOverrides({
    key: 'verification',
    values: {
      '{{subject}}': subject,
      '{{greeting}}': greeting,
      '{{verificationLink}}': payload.url,
      '{{siteName}}': siteName,
      '{{appUrl}}': appUrl,
      '{{logoUrl}}': logoUrl
    },
    fallbackHtml: htmlBody,
    fallbackText: textBody
  });

  await sendPostmark(recipientEmail, subject, resolvedTemplate.html, resolvedTemplate.text, {
    fromName: DEFAULT_WELCOME_FROM_NAME
  });
}

export async function sendResetPasswordEmail(payload: ResetPayload) {
  const recipientEmail = normalizeNonEmpty(payload.user.email).toLowerCase();
  const siteName = resolveSiteName();
  const appUrl = resolveDefaultAppUrl(payload.url);
  const logoUrl = resolveLogoUrl(undefined, appUrl);
  const greeting = payload.user.name ? `Hello ${payload.user.name},` : 'Hello,';
  const subject = `Reset your password for ${siteName}`;
  const htmlBody = await render(
    ResetPasswordEmail({
      subject,
      greeting,
      resetUrl: payload.url,
      siteName,
      appUrl,
      logoUrl
    })
  );
  const textBody = [
    greeting,
    '',
    'We received a request to reset the password for your Academics Stand Against Poverty account. You can securely reset your password using the link below:',
    '',
    payload.url,
    '',
    "If you didn't request this change, you can safely ignore this email and your existing password will remain unchanged.",
    '',
    'Best,',
    'The ASAP Global Team',
    siteName
  ].join('\n');

  const resolvedTemplate = await renderTemplateWithStoredOverrides({
    key: 'reset-password',
    values: {
      '{{subject}}': subject,
      '{{greeting}}': greeting,
      '{{resetLink}}': payload.url,
      '{{siteName}}': siteName,
      '{{appUrl}}': appUrl,
      '{{logoUrl}}': logoUrl
    },
    fallbackHtml: htmlBody,
    fallbackText: textBody
  });

  await sendPostmark(recipientEmail, subject, resolvedTemplate.html, resolvedTemplate.text, {
    fromName: DEFAULT_WELCOME_FROM_NAME
  });
}

export async function sendEmailOtpCode(payload: EmailOtpPayload) {
  const recipientEmail = normalizeNonEmpty(payload.email).toLowerCase();
  const siteName = resolveSiteName();
  const appUrl = resolveDefaultAppUrl();
  const logoUrl = resolveLogoUrl(undefined, appUrl);
  const action =
    payload.type === 'forget-password'
      ? 'reset your password'
      : payload.type === 'email-verification'
        ? 'verify your email'
        : payload.type === 'change-email'
          ? 'confirm your new email address'
          : 'sign in';
  const subject = `Your ASAP security code`;
  const htmlBody = await render(
    OtpCodeEmail({
      subject,
      action,
      otp: payload.otp,
      siteName,
      appUrl,
      logoUrl
    })
  );
  const textBody = [`Use this one-time code to ${action}:`, '', payload.otp, '', 'If you did not request this code, you can ignore this email.'].join('\n');
  const resolvedTemplate = await renderTemplateWithStoredOverrides({
    key: 'otp',
    values: {
      '{{subject}}': subject,
      '{{action}}': action,
      '{{otpCode}}': payload.otp,
      '{{siteName}}': siteName,
      '{{appUrl}}': appUrl,
      '{{logoUrl}}': logoUrl
    },
    fallbackHtml: htmlBody,
    fallbackText: textBody
  });

  await sendPostmark(recipientEmail, subject, resolvedTemplate.html, resolvedTemplate.text, {
    fromName: DEFAULT_WELCOME_FROM_NAME
  });
}

export async function sendInviteEmail(payload: InvitePayload) {
  const recipientEmail = normalizeNonEmpty(payload.email).toLowerCase();
  const role = payload.role === 'admin' ? 'admin' : 'user';
  const siteName = resolveSiteName(payload.siteName);
  const appUrl = resolveInviteAppUrl(payload);
  const roleName = normalizeNonEmpty(payload.roleName) || formatRoleName(role);
  const firstName = normalizeNonEmpty(payload.firstName) || inferFirstNameFromEmail(recipientEmail);
  const invitedByName = normalizeNonEmpty(payload.invitedByName) || DEFAULT_INVITE_FROM_NAME;
  const permissions = resolveInvitePermissions(role, payload.permissions);
  const logoUrl = resolveLogoUrl(payload.logoUrl, appUrl);
  const subject = `You're invited to join ${siteName} as ${roleName}`;
  const htmlBody = await render(
    InviteEmail({
      firstName,
      email: recipientEmail,
      appName: siteName,
      appUrl,
      roleName,
      permissions,
      inviteUrl: payload.inviteUrl,
      invitedByName,
      logoUrl
    })
  );
  const textBody = buildInviteTextBody({
    firstName,
    invitedByName,
    siteName,
    roleName,
    permissions,
    inviteUrl: payload.inviteUrl,
    recipientEmail,
    appUrl
  });

  const resolvedTemplate = await renderTemplateWithStoredOverrides({
    key: 'invite',
    values: {
      '{{firstName}}': firstName,
      '{{email}}': recipientEmail,
      '{{siteName}}': siteName,
      '{{appUrl}}': appUrl,
      '{{roleName}}': roleName,
      '{{inviteUrl}}': payload.inviteUrl,
      '{{invitedByName}}': invitedByName,
      '{{logoUrl}}': logoUrl,
      '{{permissionOne}}': permissions[0] || '',
      '{{permissionTwo}}': permissions[1] || '',
      '{{permissionThree}}': permissions[2] || ''
    },
    fallbackHtml: htmlBody,
    fallbackText: textBody
  });

  await sendPostmark(recipientEmail, subject, resolvedTemplate.html, resolvedTemplate.text, {
    fromName: DEFAULT_INVITE_FROM_NAME
  });
}

export async function sendWelcomeConfirmationEmail(payload: WelcomeConfirmationPayload) {
  const recipientEmail = normalizeNonEmpty(payload.user.email).toLowerCase();
  const siteName = resolveSiteName(payload.siteName);
  const appUrl = resolveWelcomeAppUrl(payload);
  const logoUrl = resolveLogoUrl(payload.logoUrl, appUrl);
  const firstName = inferFirstNameFromNameOrEmail(payload.user.name, recipientEmail);
  const roleName = normalizeNonEmpty(payload.roleName) || 'User';
  const subject = `Your ASAP website account is ready, ${firstName}`;
  const htmlBody = await render(
    WelcomeConfirmationEmail({
      subject,
      firstName,
      roleName,
      siteName,
      appUrl,
      logoUrl
    })
  );
  const textBody = buildWelcomeTextBody({
    firstName,
    roleName,
    siteName,
    appUrl
  });

  const resolvedTemplate = await renderTemplateWithStoredOverrides({
    key: 'welcome',
    values: {
      '{{subject}}': subject,
      '{{firstName}}': firstName,
      '{{roleName}}': roleName,
      '{{siteName}}': siteName,
      '{{appUrl}}': appUrl,
      '{{logoUrl}}': logoUrl
    },
    fallbackHtml: htmlBody,
    fallbackText: textBody
  });

  await sendPostmark(recipientEmail, subject, resolvedTemplate.html, resolvedTemplate.text, {
    fromName: DEFAULT_WELCOME_FROM_NAME
  });
}

type ContactEmailPayload = {
  name?: string | null;
  email: string;
  topic?: string | null;
  message: string;
};

export async function sendContactEmail(payload: ContactEmailPayload) {
  const { defaultContactEmailTemplates, renderContactTemplate } = await import(
    '@/lib/contact-email-templates'
  );
  const subject = process.env.CONTACT_FORM_SUBJECT || 'New contact enquiry via ASAP';
  const sentAt = new Date().toISOString();

  const defaults = await defaultContactEmailTemplates();
  const templateValues = {
    name: payload.name ?? null,
    email: payload.email,
    topic: payload.topic ?? null,
    message: payload.message,
    sentAt
  };

  const htmlBody = renderContactTemplate(defaults.html, templateValues, { html: true });
  const textBody = renderContactTemplate(defaults.text, templateValues, { html: false });
  const resolvedTemplate = await renderTemplateWithStoredOverrides({
    key: 'contact-enquiry',
    values: {
      '{{name}}': templateValues.name || '',
      '{{email}}': templateValues.email,
      '{{topic}}': templateValues.topic || '',
      '{{message}}': templateValues.message,
      '{{sentAt}}': templateValues.sentAt,
      '{{appName}}': resolveSiteName(),
      '{{appUrl}}': resolveDefaultAppUrl(),
      '{{logoUrl}}': resolveLogoUrl(undefined, resolveDefaultAppUrl())
    },
    fallbackHtml: htmlBody,
    fallbackText: textBody
  });

  const recipient = getContactRecipient();
  if (!recipient) {
    console.warn('[contact-email] missing CONTACT_FORM_TO; skipping send');
    return;
  }

  await sendPostmark(recipient, subject, resolvedTemplate.html, resolvedTemplate.text, {
    replyTo: payload.email
  });
}

type WaitlistNotifyPayload = {
  email: string;
  source?: string | null;
  userAgent?: string | null;
  createdAtIso?: string;
};

export async function sendWaitlistSignupNotificationEmail(payload: WaitlistNotifyPayload) {
  const to = (process.env.WAITLIST_NOTIFY_TO || process.env.POSTMARK_FROM_EMAIL || '').trim();
  if (!to) {
    console.warn('[waitlist-email] missing WAITLIST_NOTIFY_TO/POSTMARK_FROM_EMAIL; skipping send');
    return;
  }

  const siteName = resolveSiteName();
  const appUrl = resolveDefaultAppUrl();
  const logoUrl = resolveLogoUrl(undefined, appUrl);
  const source = payload.source || 'unknown';
  const userAgent = payload.userAgent || 'unknown';
  const createdAt = payload.createdAtIso || new Date().toISOString();
  const subject = `New waitlist signup for ${siteName}`;
  const htmlBody = await render(
    WaitlistSignupNotificationEmail({
      subject,
      siteName,
      appUrl,
      logoUrl,
      email: payload.email,
      source,
      userAgent,
      createdAt
    })
  );
  const textBody = [
    'A new user has joined the waitlist for the Academics Stand Against Poverty platform.',
    '',
    `Email: ${payload.email}`,
    `Source: ${source}`,
    `User agent: ${userAgent}`,
    `Time: ${createdAt}`
  ].join('\n');

  const resolvedTemplate = await renderTemplateWithStoredOverrides({
    key: 'waitlist-notification',
    values: {
      '{{subject}}': subject,
      '{{siteName}}': siteName,
      '{{appUrl}}': appUrl,
      '{{logoUrl}}': logoUrl,
      '{{email}}': payload.email,
      '{{source}}': source,
      '{{userAgent}}': userAgent,
      '{{createdAt}}': createdAt
    },
    fallbackHtml: htmlBody,
    fallbackText: textBody
  });

  await sendPostmark(to, subject, resolvedTemplate.html, resolvedTemplate.text);
}
