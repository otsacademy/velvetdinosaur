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

type InvitePayload = {
  email: string;
  inviteUrl: string;
  siteName?: string;
  greeting?: string;
};

const POSTMARK_API = 'https://api.postmarkapp.com/email';

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
  options?: { replyTo?: string }
) {
  const { token, from } = getPostmarkConfig();
  if (!token || !from) {
    // Fall back to console logging when not configured.
    console.warn('[postmark] missing POSTMARK_SERVER_TOKEN or POSTMARK_FROM_EMAIL; logging instead');
    console.info({ to, subject, htmlBody, textBody, replyTo: options?.replyTo });
    return;
  }

  const res = await fetch(POSTMARK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': token
    },
    body: JSON.stringify({
      From: from,
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
  const to = payload.user.email;
  const subject = 'Verify your email';
  const nameLine = payload.user.name ? `Hello ${payload.user.name},` : 'Hello,';
  const htmlBody = `<p>${nameLine}</p><p>Please verify your email by clicking the link below:</p><p><a href="${payload.url}">${payload.url}</a></p><p>If you did not request this, you can ignore this email.</p>`;
  const textBody = `${nameLine}\n\nVerify your email by visiting: ${payload.url}\n\nIf you did not request this, ignore this email.`;

  await sendPostmark(to, subject, htmlBody, textBody);
}

export async function sendResetPasswordEmail(payload: ResetPayload) {
  const to = payload.user.email;
  const subject = 'Reset your password';
  const nameLine = payload.user.name ? `Hello ${payload.user.name},` : 'Hello,';
  const htmlBody = `<p>${nameLine}</p><p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${payload.url}">${payload.url}</a></p><p>If you did not request this, you can ignore this email.</p>`;
  const textBody = `${nameLine}\n\nReset your password here: ${payload.url}\n\nIf you did not request this, ignore this email.`;

  await sendPostmark(to, subject, htmlBody, textBody);
}

export async function sendInviteEmail(payload: InvitePayload) {
  const siteName = payload.siteName || process.env.NEXT_PUBLIC_SITE_NAME || 'Your site';
  const greeting = payload.greeting || 'Hello';
  const subject = `Your ${siteName} invite is ready`;
  const htmlBody = `<p>${greeting},</p><p>Your invite is ready. Use the link below to set your password and sign in:</p><p><a href="${payload.inviteUrl}">Set up your password</a></p><p>If you were not expecting this invite, you can ignore this email.</p>`;
  const textBody = `${greeting},\n\nYour invite is ready. Set your password and sign in:\n${payload.inviteUrl}\n\nIf you were not expecting this invite, you can ignore this email.`;

  await sendPostmark(payload.email, subject, htmlBody, textBody);
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
  const { connectDB } = await import('@/lib/db');
  const { ContactSettings } = await import('@/models/ContactSettings');
  const subject = process.env.CONTACT_FORM_SUBJECT || 'New contact enquiry';
  const sentAt = new Date().toISOString();
  let htmlTemplate: string | null = null;
  let textTemplate: string | null = null;

  try {
    await connectDB();
    const doc = (await ContactSettings.findOne({}).lean()) as
      | { contactEmailHtml?: string; contactEmailText?: string }
      | null;
    htmlTemplate = doc?.contactEmailHtml ?? null;
    textTemplate = doc?.contactEmailText ?? null;
  } catch (error) {
    console.warn('[contact-email] unable to load templates, using defaults');
  }

  const defaults = await defaultContactEmailTemplates();
  const templateValues = {
    name: payload.name ?? null,
    email: payload.email,
    topic: payload.topic ?? null,
    message: payload.message,
    sentAt
  };

  const htmlBody = renderContactTemplate(htmlTemplate || defaults.html, templateValues, { html: true });
  const textBody = renderContactTemplate(textTemplate || defaults.text, templateValues, { html: false });

  const recipient = getContactRecipient();
  if (!recipient) {
    console.warn('[contact-email] missing CONTACT_FORM_TO; skipping send');
    return;
  }

  await sendPostmark(recipient, subject, htmlBody, textBody, { replyTo: payload.email });
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

  const subject = 'New waitlist signup';
  const createdAt = payload.createdAtIso || new Date().toISOString();
  const htmlBody = `<p><strong>New waitlist signup</strong></p>
<p><strong>Email:</strong> ${payload.email}</p>
<p><strong>Source:</strong> ${payload.source || 'unknown'}</p>
<p><strong>User agent:</strong> ${payload.userAgent || 'unknown'}</p>
<p><strong>At:</strong> ${createdAt}</p>`;
  const textBody = `New waitlist signup\n\nEmail: ${payload.email}\nSource: ${
    payload.source || 'unknown'
  }\nUser agent: ${payload.userAgent || 'unknown'}\nAt: ${createdAt}\n`;

  await sendPostmark(to, subject, htmlBody, textBody);
}
