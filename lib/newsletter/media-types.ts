export type NewsletterBodySource = 'visual' | 'html' | 'text';

export type NewsletterAttachment = {
  assetKey: string;
  name: string;
  mime: string;
  size: number;
};

export type NewsletterMediaItem = NewsletterAttachment & {
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  renditionId?: string;
};

export type NewsletterMediaReference = { id: string; assetKey: string; sha256: string };
export type NewsletterMediaManifest = {
  version: 1;
  preparedAt: string;
  images: NewsletterMediaReference[];
  attachments: Array<NewsletterMediaReference & Omit<NewsletterAttachment, 'assetKey'>>;
};

export type NewsletterPreparedAttachment = {
  Name: string;
  Content: string;
  ContentType: string;
  ContentID: string | null;
};

export const NEWSLETTER_ATTACHMENT_LIMIT = 5;
export const NEWSLETTER_ATTACHMENT_BYTES = 5 * 1024 * 1024;
// Leave room for provider envelope and MIME headers below its 10 MB ceiling.
export const NEWSLETTER_MESSAGE_BYTES = 9_500_000;
