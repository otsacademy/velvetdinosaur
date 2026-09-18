import type { NewsletterAttachment } from './media-types';
export type { NewsletterAttachment, NewsletterMediaItem, NewsletterBodySource } from './media-types';
export { NEWSLETTER_ATTACHMENT_BYTES as NEWSLETTER_ATTACHMENT_LIMIT } from './media-types';
import { NEWSLETTER_ATTACHMENT_BYTES } from './media-types';
export const NEWSLETTER_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
export const NEWSLETTER_ATTACHMENT_MIMES = ['application/pdf', ...NEWSLETTER_IMAGE_MIMES];
export function validateNewsletterAttachments(items: NewsletterAttachment[]) {
  if (items.length > 5) return 'Choose up to five attachments.';
  if (new Set(items.map((item) => item.assetKey)).size !== items.length) return 'This file is already attached.';
  if (items.some((item) => !NEWSLETTER_ATTACHMENT_MIMES.includes(item.mime))) return 'Attachments must be PDF, JPEG, PNG or WebP images.';
  if (items.some((item) => !Number.isFinite(item.size) || item.size < 0)) return 'The attachment size is unavailable.';
  if (items.reduce((total, item) => total + item.size, 0) > NEWSLETTER_ATTACHMENT_BYTES) return 'Attachments must total 5 MiB or less.';
  return '';
}
export function newsletterMediaDisplayUrl(url: string) { return url.replace(/^\{\{appUrl\}\}/, ''); }
