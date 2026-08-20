export const EVENT_REGISTRATION_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;
export const EVENT_REGISTRATION_EVENT_TYPES = [
  'request',
  'confirm',
  'cancel',
  'resend-confirmation'
] as const;
export const EVENT_CAMPAIGN_KINDS = ['update', 'joining-instructions'] as const;
export const EVENT_CAMPAIGN_STATUSES = ['draft', 'queued', 'sending', 'completed', 'cancelled'] as const;
export const EVENT_DELIVERY_STATUSES = ['pending', 'sent', 'failed', 'skipped_unconfirmed'] as const;

export type EventRegistrationStatus = (typeof EVENT_REGISTRATION_STATUSES)[number];
export type EventRegistrationEventType = (typeof EVENT_REGISTRATION_EVENT_TYPES)[number];
export type EventCampaignKind = (typeof EVENT_CAMPAIGN_KINDS)[number];
export type EventCampaignStatus = (typeof EVENT_CAMPAIGN_STATUSES)[number];
export type EventDeliveryStatus = (typeof EVENT_DELIVERY_STATUSES)[number];

export function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeEmail(value: unknown) {
  return clean(value).toLowerCase();
}

export function toIdString(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && 'toString' in value) {
    const cast = value as { toString?: () => string };
    return cast.toString?.() || '';
  }
  return '';
}

export function toFirstName(value: unknown, fallbackEmail?: string) {
  const fromValue = clean(value)
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let source = fromValue;
  if (!source) {
    const email = normalizeEmail(fallbackEmail);
    const localPart = email.split('@')[0]?.split('+')[0] || '';
    source = localPart
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const first = source.split(' ').find(Boolean) || '';
  return first ? `${first.charAt(0).toUpperCase()}${first.slice(1)}` : '';
}

export function toFullName(value: unknown, fallbackEmail?: string) {
  const fullName = clean(value).replace(/\s+/g, ' ').trim();
  if (fullName) return fullName;
  return toFirstName('', fallbackEmail);
}

export function normalizeEventRegistrationStatus(value: unknown): EventRegistrationStatus {
  if (value === 'confirmed') return 'confirmed';
  if (value === 'cancelled') return 'cancelled';
  return 'pending';
}

export function normalizeEventCampaignKind(value: unknown): EventCampaignKind {
  return value === 'joining-instructions' ? 'joining-instructions' : 'update';
}

export function normalizeEventCampaignStatus(value: unknown): EventCampaignStatus {
  if (value === 'queued') return 'queued';
  if (value === 'sending') return 'sending';
  if (value === 'completed') return 'completed';
  if (value === 'cancelled') return 'cancelled';
  return 'draft';
}

export function normalizeEventDeliveryStatus(value: unknown): EventDeliveryStatus {
  if (value === 'sent') return 'sent';
  if (value === 'failed') return 'failed';
  if (value === 'skipped_unconfirmed') return 'skipped_unconfirmed';
  return 'pending';
}
