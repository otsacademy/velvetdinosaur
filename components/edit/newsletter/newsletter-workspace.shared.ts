export type NewsletterStatus = 'not_consented' | 'pending' | 'subscribed' | 'unsubscribed';
export type CampaignStatus = 'draft' | 'queued' | 'sending' | 'completed' | 'cancelled';
export type DeliveryStatus =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'skipped_no_consent'
  | 'skipped_unsubscribed'
  | 'skipped_suppressed';

export type PreferenceItem = {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  status: NewsletterStatus;
  updatedAt: string | null;
};

export type CampaignItem = {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
  visualBody: unknown[];
  status: CampaignStatus;
  scheduledAt: string | null;
  recipientSnapshotCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  createdAt: string | null;
};

export type DeliveryItem = {
  id: string;
  campaignId: string;
  userId: string;
  email: string;
  firstName: string;
  status: DeliveryStatus;
  postmarkMessageId: string;
  sentAt: string | null;
  error: string;
  attempts: number;
  createdAt: string | null;
};

export type OverviewPayload = {
  counts: {
    total: number;
    subscribed: number;
    pending: number;
    unsubscribed: number;
    notConsented: number;
    suppressed: number;
  };
  campaignStatus: Record<CampaignStatus, number>;
  defaults: {
    htmlBody: string;
    textBody: string;
  };
};

export type NewsletterAdminSettings = {
  requireDoubleOptIn: boolean;
  enableHoneypot: boolean;
  minSecondsToSubmit: number;
  rateLimitPerIpPerMinute: number;
  rateLimitPerIpPerHour: number;
  rateLimitPerEmailPerDay: number;
  requireCaptcha: boolean;
  captchaProvider: 'none' | 'turnstile';
  turnstileSiteKey: string;
  turnstileSecretKey: string;
  pendingTokenTtlMinutes: number;
  resendConfirmationCooldownMinutes: number;
  blockSuppressedAddresses: boolean;
};

export type CampaignFormState = {
  campaignId: string;
  name: string;
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
  visualBody: unknown[];
  scheduledAt: string;
};

export const EMPTY_OVERVIEW: OverviewPayload = {
  counts: {
    total: 0,
    subscribed: 0,
    pending: 0,
    unsubscribed: 0,
    notConsented: 0,
    suppressed: 0
  },
  campaignStatus: {
    draft: 0,
    queued: 0,
    sending: 0,
    completed: 0,
    cancelled: 0
  },
  defaults: {
    htmlBody: [
      '<p>Hello {{firstName}},</p>',
      '<p>Here are this week&apos;s updates from {{siteName}}.</p>',
      '<h2>Latest News</h2>',
      '{{newsHighlights}}',
      '<h2>Upcoming Events</h2>',
      '{{eventHighlights}}',
      '<p>Best,<br/>The team</p>'
    ].join(''),
    textBody: [
      'Hello {{firstName}},',
      '',
      'Here are this week\'s updates from {{siteName}}.',
      '',
      'Latest News',
      '{{newsHighlights}}',
      '',
      'Upcoming Events',
      '{{eventHighlights}}',
      '',
      'Best,',
      'The team'
    ].join('\n')
  }
};

export const DEFAULT_NEWSLETTER_ADMIN_SETTINGS: NewsletterAdminSettings = {
  requireDoubleOptIn: true,
  enableHoneypot: true,
  minSecondsToSubmit: 3,
  rateLimitPerIpPerMinute: 20,
  rateLimitPerIpPerHour: 120,
  rateLimitPerEmailPerDay: 8,
  requireCaptcha: false,
  captchaProvider: 'none',
  turnstileSiteKey: '',
  turnstileSecretKey: '',
  pendingTokenTtlMinutes: 4320,
  resendConfirmationCooldownMinutes: 15,
  blockSuppressedAddresses: true
};

export function toDateTimeLocalInput(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function fromDateTimeLocalInput(value: string) {
  if (!value.trim()) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
}

export function formatDate(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString();
}

export function buildInitialForm(defaults: OverviewPayload['defaults']): CampaignFormState {
  return {
    campaignId: '',
    name: 'Newsletter Draft',
    subject: 'Newsletter Update',
    preheader: 'Latest news, events, and updates.',
    htmlBody: defaults.htmlBody,
    textBody: defaults.textBody,
    visualBody: [],
    scheduledAt: ''
  };
}
