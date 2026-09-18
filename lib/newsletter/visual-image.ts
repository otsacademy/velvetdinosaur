import type { EmailTemplateVisualNode } from '@/lib/email-template-visual';

function escape(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
export function safeNewsletterImageLink(value: unknown) {
  if (typeof value !== 'string') return '';
  const link = value.trim();
  return /^(https?:\/\/|mailto:)[^\s]+$/i.test(link) ? link : '';
}
function imageSource(node: EmailTemplateVisualNode) {
  if (typeof node.renditionId === 'string' && /^[a-zA-Z0-9_-]+$/.test(node.renditionId)) {
    return `{{appUrl}}/api/newsletter/media/${node.renditionId}`;
  }
  // Local-only public demo assets are never accepted by the production preparation service.
  const url = typeof node.url === 'string' ? node.url : '';
  return /^(blob:|\/assets\/demo-media\/|\/portfolio\/)/.test(url) ? url : '';
}
export function newsletterImageCaption(node: EmailTemplateVisualNode) {
  return Array.isArray(node.caption) ? node.caption.map((part) => typeof part?.text === 'string' ? part.text : '').join('') : '';
}
export function serializeNewsletterImageHtml(node: EmailTemplateVisualNode) {
  const source = imageSource(node);
  if (!source) throw new Error('Choose this image from the newsletter media library again before saving.');
  const decorative = node.decorative === true;
  const alt = decorative ? '' : typeof node.alt === 'string' ? node.alt.trim() : '';
  if (!decorative && !alt) throw new Error('Add alternative text or mark the image as decorative.');
  const width = Math.round(Math.max(1, Math.min(560, Number(node.width) || 560)));
  const align = node.align === 'left' || node.align === 'right' ? node.align : 'center';
  const height = Number(node.initialWidth) > 0 && Number(node.initialHeight) > 0 ? Math.max(1, Math.round(width * Number(node.initialHeight) / Number(node.initialWidth))) : undefined;
  const caption = newsletterImageCaption(node);
  const link = safeNewsletterImageLink(node.link);
  const image = `<img src="${escape(source)}" alt="${escape(alt)}" width="${width}"${height ? ` height="${height}"` : ''}${decorative ? ' role="presentation"' : ''} style="display:block;width:${width}px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none" />`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 16px"><tr><td align="${align}">${link ? `<a href="${escape(link)}">${image}</a>` : image}${caption ? `<p style="margin:8px 0 0;font-size:13px;line-height:1.5;text-align:${align}">${escape(caption)}</p>` : ''}</td></tr></table>`;
}
export function serializeNewsletterImageText(node: EmailTemplateVisualNode) {
  const alt = node.decorative === true ? '' : typeof node.alt === 'string' ? node.alt.trim() : '';
  const caption = newsletterImageCaption(node);
  const link = safeNewsletterImageLink(node.link);
  return [alt ? `[Image: ${alt}]` : '', caption, link].filter(Boolean).join('\n');
}
