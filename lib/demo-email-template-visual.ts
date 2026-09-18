import { visualValueToBodyHtml, visualValueToPlainText } from '@/lib/email-template-visual';
export { ensureVisualValue, visualValueFromPlainText, visualValueToBodyHtml, visualValueToPlainText } from '@/lib/email-template-visual';
export type { EmailTemplateVisualNode as DemoEmailTemplateVisualNode } from '@/lib/email-template-visual';
function escapeHtml(value: string) { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }

export function buildDemoBrandedEmailHtml(input: {
  previewText: string;
  heading: string;
  siteName: string;
  appUrl: string;
  bodyHtml: string;
  logoUrl?: string;
}) {
  const logoMarkup = input.logoUrl?.trim()
    ? `<img src="${escapeHtml(input.logoUrl.trim())}" alt="${escapeHtml(input.siteName)}" width="120" style="display:block;width:120px;max-width:100%;height:auto;border:0" />`
    : `<div style="font-size:12px;letter-spacing:0.32em;text-transform:uppercase;color:#6b7a74">${escapeHtml(input.siteName)}</div>`;

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charSet="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '<meta name="x-apple-disable-message-reformatting" />',
    `<title>${escapeHtml(input.heading)}</title>`,
    '</head>',
    '<body style="margin:0;padding:32px 12px;background:#f3ece3;font-family:Georgia,Times New Roman,serif;">',
    `<div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">${escapeHtml(input.previewText)}</div>`,
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">',
    '<tr><td align="center">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;border-collapse:collapse;">',
    `<tr><td style="padding:0 14px 16px 14px;text-align:center;">${logoMarkup}</td></tr>`,
    '<tr><td style="padding:0 0 20px 0;">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#fffdf9;border:1px solid #e4d7c5;border-radius:28px;overflow:hidden;">',
    '<tr><td style="padding:34px 36px 28px 36px;background:linear-gradient(180deg,#f8f1e8 0%,#fffdf9 100%);border-bottom:1px solid #ede2d3;">',
    '<p style="margin:0 0 10px 0;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#7a6a57;">Studio bulletin</p>',
    `<h1 style="margin:0;font-size:34px;line-height:1.08;font-weight:700;color:#183029;">${escapeHtml(input.heading)}</h1>`,
    `<p style="margin:14px 0 0 0;font-size:16px;line-height:1.7;color:#55645f;">${escapeHtml(input.previewText)}</p>`,
    '</td></tr>',
    `<tr><td style="padding:34px 36px 18px 36px;">${input.bodyHtml}</td></tr>`,
    '<tr><td style="padding:20px 36px 34px 36px;border-top:1px solid #ede2d3;">',
    `<p style="margin:0 0 16px 0;font-size:13px;line-height:1.7;color:#66746f;">You are receiving this demonstration newsletter from ${escapeHtml(input.siteName)}.</p>`,
    `<a href="${escapeHtml(input.appUrl)}" style="display:inline-block;border-radius:999px;background:#183029;color:#fff8ef;text-decoration:none;padding:12px 20px;font-size:13px;font-weight:700;letter-spacing:0.04em;">Open the studio</a>`,
    '<p style="margin:16px 0 0 0;font-size:12px;line-height:1.7;color:#8b7b67;">This is a sandboxed preview. No campaign is sent, scheduled, or stored permanently.</p>',
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</body>',
    '</html>'
  ].join('');
}

export function visualValueToEmailHtml(input: {
  value: unknown;
  heading: string;
  previewText?: string;
  siteNameToken?: string;
  appUrlToken?: string;
  logoUrlToken?: string;
}) {
  const plainText = visualValueToPlainText(input.value);
  const previewText = input.previewText?.trim() || plainText.split('\n').find((line) => line.trim()) || 'Email update';

  return buildDemoBrandedEmailHtml({
    previewText,
    heading: input.heading,
    siteName: input.siteNameToken || '{{siteName}}',
    appUrl: input.appUrlToken || '{{appUrl}}',
    logoUrl: input.logoUrlToken || '{{logoUrl}}',
    bodyHtml: visualValueToBodyHtml(input.value)
  });
}
