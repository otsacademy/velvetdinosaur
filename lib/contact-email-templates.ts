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
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { ContactEnquiryEmail } = await import('@/components/email/contact-enquiry-email');
  const html = renderToStaticMarkup(
    ContactEnquiryEmail({
      name: '{{name}}',
      email: '{{email}}',
      topic: '{{topic}}',
      message: '{{message}}',
      sentAt: '{{sentAt}}'
    })
  );
  const text = [
    'New contact enquiry',
    '',
    'Name: {{name}}',
    'Email: {{email}}',
    'Topic: {{topic}}',
    '',
    'Message:',
    '{{message}}',
    '',
    'Received: {{sentAt}}'
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
