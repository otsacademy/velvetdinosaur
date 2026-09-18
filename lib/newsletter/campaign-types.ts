import { clean, normalizeEmail, toIdString } from './shared';
import type { NewsletterAttachment, NewsletterBodySource, NewsletterMediaManifest } from './media-types';
export type FrozenNewsletterContent = { subject: string; preheader: string; htmlBody: string; textBody: string; manifest: NewsletterMediaManifest };

type CampaignStatus = 'draft' | 'queued' | 'sending' | 'completed' | 'cancelled';
type DeliveryStatus =
  | 'pending'
  | 'processing'
  | 'needs_review'
  | 'sent'
  | 'failed'
  | 'skipped_no_consent'
  | 'skipped_unsubscribed'
  | 'skipped_suppressed';
export type NewsletterDeliveryStatus = DeliveryStatus;

export type CampaignDoc = {
  _id?: unknown;
  name?: string;
  subject?: string;
  preheader?: string;
  htmlBody?: string;
  textBody?: string;
  visualBody?: unknown;
  attachments?: NewsletterAttachment[];
  bodySource?: NewsletterBodySource;
  frozenContent?: FrozenNewsletterContent;
  preparationToken?: string | null;
  dispatchLeaseToken?: string | null;
  needsReviewCount?: number;
  status?: CampaignStatus;
  scheduledAt?: Date | string | null;
  queuedAt?: Date | string | null;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  createdByUserId?: string;
  recipientSnapshotCount?: number;
  sentCount?: number;
  failedCount?: number;
  skippedCount?: number;
  lastError?: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export type DeliveryDoc = {
  _id?: unknown;
  campaignId?: string;
  userId?: string;
  email?: string;
  firstName?: string;
  status?: DeliveryStatus;
  postmarkMessageId?: string;
  sentAt?: Date | string | null;
  error?: string;
  attempts?: number;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export type NewsletterCampaignSummary = {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
  visualBody: unknown[];
  attachments: NewsletterAttachment[];
  bodySource: NewsletterBodySource;
  needsReviewCount: number;
  status: CampaignStatus;
  scheduledAt: string | null;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdByUserId: string;
  recipientSnapshotCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  lastError: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type NewsletterDeliverySummary = {
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
  updatedAt: string | null;
};

function toDateIsoOrNull(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function normalizeCampaignStatus(value: unknown): CampaignStatus {
  if (value === 'queued') return 'queued';
  if (value === 'sending') return 'sending';
  if (value === 'completed') return 'completed';
  if (value === 'cancelled') return 'cancelled';
  return 'draft';
}

function normalizeDeliveryStatus(value: unknown): DeliveryStatus {
  if (value === 'processing') return 'processing';
  if (value === 'needs_review') return 'needs_review';
  if (value === 'sent') return 'sent';
  if (value === 'failed') return 'failed';
  if (value === 'skipped_no_consent') return 'skipped_no_consent';
  if (value === 'skipped_unsubscribed') return 'skipped_unsubscribed';
  if (value === 'skipped_suppressed') return 'skipped_suppressed';
  return 'pending';
}

export function mapCampaign(doc: CampaignDoc): NewsletterCampaignSummary {
  return {
    id: toIdString(doc._id),
    name: clean(doc.name),
    subject: clean(doc.subject),
    preheader: clean(doc.preheader),
    htmlBody: doc.htmlBody || '',
    textBody: doc.textBody || '',
    visualBody: Array.isArray(doc.visualBody) ? doc.visualBody : [],
    attachments: doc.attachments || [],
    bodySource: doc.bodySource || (Array.isArray(doc.visualBody) && doc.visualBody.length ? 'visual' : 'html'),
    needsReviewCount: doc.needsReviewCount || 0,
    status: normalizeCampaignStatus(doc.status),
    scheduledAt: toDateIsoOrNull(doc.scheduledAt),
    queuedAt: toDateIsoOrNull(doc.queuedAt),
    startedAt: toDateIsoOrNull(doc.startedAt),
    completedAt: toDateIsoOrNull(doc.completedAt),
    createdByUserId: clean(doc.createdByUserId),
    recipientSnapshotCount: Math.max(0, Math.round(Number(doc.recipientSnapshotCount || 0))),
    sentCount: Math.max(0, Math.round(Number(doc.sentCount || 0))),
    failedCount: Math.max(0, Math.round(Number(doc.failedCount || 0))),
    skippedCount: Math.max(0, Math.round(Number(doc.skippedCount || 0))),
    lastError: clean(doc.lastError),
    createdAt: toDateIsoOrNull(doc.createdAt),
    updatedAt: toDateIsoOrNull(doc.updatedAt)
  };
}

export function mapDelivery(doc: DeliveryDoc): NewsletterDeliverySummary {
  return {
    id: toIdString(doc._id),
    campaignId: clean(doc.campaignId),
    userId: clean(doc.userId),
    email: normalizeEmail(doc.email),
    firstName: clean(doc.firstName),
    status: normalizeDeliveryStatus(doc.status),
    postmarkMessageId: clean(doc.postmarkMessageId),
    sentAt: toDateIsoOrNull(doc.sentAt),
    error: clean(doc.error),
    attempts: Math.max(0, Math.round(Number(doc.attempts || 0))),
    createdAt: toDateIsoOrNull(doc.createdAt),
    updatedAt: toDateIsoOrNull(doc.updatedAt)
  };
}
