import { ensureVisualValue, visualValueFromPlainText, visualValueToEmailHtml, visualValueToPlainText } from '@/lib/email-template-visual';
import type { NewsletterBodySource } from './media-client-types';
export type NewsletterComposerSource = {
  bodySource?: NewsletterBodySource; visualBody: unknown[]; htmlBody: string; textBody: string;
  subject: string; name: string; preheader: string;
};
export function getNewsletterBodySource(input: Pick<NewsletterComposerSource, 'bodySource' | 'visualBody'>): NewsletterBodySource {
  return input.bodySource || (input.visualBody?.length ? 'visual' : 'html');
}
export function deriveNewsletterComposerSource(input: NewsletterComposerSource, visualOverride?: unknown[], renderHtml = visualValueToEmailHtml) {
  const bodySource = visualOverride ? 'visual' : getNewsletterBodySource(input);
  const visualBody = ensureVisualValue(visualOverride || (input.visualBody?.length ? input.visualBody : visualValueFromPlainText(input.textBody)));
  const textBody = bodySource === 'visual' ? visualValueToPlainText(visualBody) : input.textBody;
  const htmlBody = bodySource === 'html' ? input.htmlBody : renderHtml({
    value: bodySource === 'text' ? visualValueFromPlainText(textBody) : visualBody,
    heading: (input.subject || input.name || 'Newsletter update').trim(), previewText: input.preheader || textBody,
    siteNameToken: '{{siteName}}', appUrlToken: '{{appUrl}}', logoUrlToken: '{{logoUrl}}'
  });
  return { htmlBody, textBody, visualBody, bodySource };
}
