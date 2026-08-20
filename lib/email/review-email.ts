import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/email/review-email.ts');

import { render } from '@react-email/render';
import { ServerClient } from 'postmark';
import { ReviewLinkEmail } from '@/components/email/review-link-email';
import { resolveDefaultAppUrl, resolveLogoUrl, resolveSiteName } from '@/lib/email-branding';
import { renderTemplateWithStoredOverrides } from '@/lib/system-email-templates';

type ReviewEmailPayload = {
  to: string;
  firstName?: string | null;
  reviewUrl: string;
  startsAt?: Date;
  deadlineAt: Date;
};

function getPostmarkConfig() {
  const token = (process.env.POSTMARK_SERVER_TOKEN || '').trim();
  const from = (
    process.env.POSTMARK_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    process.env.NEXT_PUBLIC_EMAIL_FROM ||
    ''
  ).trim();
  return { token, from };
}

function formatDeadline(deadlineAt: Date) {
  return deadlineAt.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatStart(startsAt?: Date) {
  if (!startsAt || Number.isNaN(startsAt.getTime())) return '';
  return startsAt.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function toGreeting(firstName: string | null | undefined, email: string) {
  const cleanedFirstName = (firstName || '').trim();
  if (cleanedFirstName) {
    const normalized = cleanedFirstName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 1)
      .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
      .join(' ');
    if (normalized) return `Hello ${normalized},`;
  }

  const localPart = email.split('@')[0] || '';
  const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'Hello,';
  const formatted = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
  return `Hello ${formatted},`;
}

export async function sendReviewLinkEmail({ to, firstName, reviewUrl, startsAt, deadlineAt }: ReviewEmailPayload) {
  const recipient = (to || '').trim().toLowerCase();
  if (!recipient) {
    throw new Error('Recipient email is required');
  }

  const { token, from } = getPostmarkConfig();
  if (!token || !from) {
    console.warn('[review-email] missing POSTMARK_SERVER_TOKEN or POSTMARK_FROM_EMAIL; skipping send');
    return { sent: false };
  }

  const siteName = resolveSiteName();
  const appUrl = resolveDefaultAppUrl(reviewUrl);
  const logoUrl = resolveLogoUrl(undefined, appUrl);
  const subject = `Review Request: Please provide feedback for ${siteName}`;
  const deadlineLabel = formatDeadline(deadlineAt);
  const startsLabel = formatStart(startsAt);
  const greeting = toGreeting(firstName, recipient);
  const htmlBody = await render(
    ReviewLinkEmail({
      subject,
      greeting,
      startsLabel,
      deadlineLabel,
      reviewUrl,
      siteName,
      appUrl,
      logoUrl
    })
  );

  const textBody = [
    greeting,
    '',
    'You have been invited to review website updates for Academics Stand Against Poverty. Please share your comments in review mode so we can improve both content and user experience.',
    '',
    'Please review the draft and submit your feedback before the deadline.',
    '',
    startsLabel ? `Review opens: ${startsLabel}` : '',
    `Deadline: ${deadlineLabel}`,
    `Review Link: ${reviewUrl}`,
    '',
    'Note: This link will expire automatically at the deadline above.',
    '',
    'Thank you for your time and expertise.',
    '',
    'Best,',
    'The ASAP Global Team',
    siteName
  ].join('\n');
  const resolvedTemplate = await renderTemplateWithStoredOverrides({
    key: 'review-request',
    values: {
      '{{subject}}': subject,
      '{{greeting}}': greeting,
      '{{reviewStart}}': startsLabel,
      '{{deadline}}': deadlineLabel,
      '{{reviewLink}}': reviewUrl,
      '{{siteName}}': siteName,
      '{{appUrl}}': appUrl,
      '{{logoUrl}}': logoUrl
    },
    fallbackHtml: htmlBody,
    fallbackText: textBody
  });

  const client = new ServerClient(token);
  await client.sendEmail({
    From: from,
    To: recipient,
    Subject: subject,
    HtmlBody: resolvedTemplate.html,
    TextBody: resolvedTemplate.text,
    MessageStream: 'outbound'
  });

  return { sent: true };
}
