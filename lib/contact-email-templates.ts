import { resolveDefaultAppUrl, resolveLogoUrl, resolveSiteName } from '@/lib/email-branding';
import { render } from '@react-email/render';

type ContactTemplateValues = {
  name?: string | null;
  email: string;
  topic?: string | null;
  message: string;
  sentAt: string;
};

const PLACEHOLDERS = ['name', 'email', 'topic', 'message', 'sentAt'] as const;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '-';
}

export async function defaultContactEmailTemplates() {
  const { ContactEnquiryEmail } = await import('@/components/email/contact-enquiry-email');
  const appName = resolveSiteName();
  const appUrl = resolveDefaultAppUrl();
  const logoUrl = resolveLogoUrl(undefined, appUrl);
  const html = await render(
    ContactEnquiryEmail({
      name: '{{name}}',
      email: '{{email}}',
      topic: '{{topic}}',
      message: '{{message}}',
      sentAt: '{{sentAt}}',
      appName,
      appUrl,
      logoUrl
    })
  );
  const text = [
    'You have received a new contact enquiry from the Academics Stand Against Poverty website.',
    '',
    'Name: {{name}}',
    'Email: {{email}}',
    'Topic: {{topic}}',
    '',
    'Message:',
    '{{message}}',
    '',
    'Received: {{sentAt}}',
    '',
    'Reply directly to this email to respond to the sender.'
  ].join('\n');
  return { html, text };
}

export function renderContactTemplate(
  template: string,
  values: ContactTemplateValues,
  options?: { html?: boolean }
) {
  const html = Boolean(options?.html);
  let output = template;
  for (const key of PLACEHOLDERS) {
    const raw = normalizeValue(values[key]);
    const formatted = html ? escapeHtml(raw).replace(/\n/g, '<br />') : raw;
    output = output.replaceAll(`{{${key}}}`, formatted);
  }
  return output;
}
