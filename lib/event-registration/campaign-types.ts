import { clean, normalizeEventCampaignKind, normalizeEventCampaignStatus, normalizeEventDeliveryStatus, normalizeEmail, toIdString, type EventCampaignKind, type EventCampaignStatus, type EventDeliveryStatus } from "./shared";
export type CampaignDoc = {
  dispatchLeaseToken?: string | null;
  dispatchLeaseUntil?: Date | null;
  needsReviewCount?: number;
  frozenEvent?: { slug: string; title: string; dateLabel: string; location: string; joiningInstructions: string } | null;
  _id?: unknown;
  eventId?: string;
  eventSlug?: string;
  eventTitle?: string;
  campaignKind?: EventCampaignKind;
  name?: string;
  subject?: string;
  preheader?: string;
  htmlBody?: string;
  textBody?: string;
  visualBody?: unknown;
  status?: EventCampaignStatus;
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
  eventId?: string;
  registrationId?: string;
  email?: string;
  firstName?: string;
  status?: EventDeliveryStatus;
  postmarkMessageId?: string;
  sentAt?: Date | string | null;
  error?: string;
  attempts?: number;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

function toDateIsoOrNull(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function parseScheduledAt(value: string | Date | null | undefined) {
  if (!value) return new Date();
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export type EventRegistrationCampaignSummary = {
  needsReviewCount: number;
  id: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  campaignKind: EventCampaignKind;
  name: string;
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
  visualBody: unknown[];
  status: EventCampaignStatus;
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

export type EventRegistrationDeliverySummary = {
  id: string;
  campaignId: string;
  eventId: string;
  registrationId: string;
  email: string;
  firstName: string;
  status: EventDeliveryStatus;
  postmarkMessageId: string;
  sentAt: string | null;
  error: string;
  attempts: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export function mapCampaign(doc: CampaignDoc): EventRegistrationCampaignSummary {
  return {
    needsReviewCount: Math.max(0, Number(doc.needsReviewCount || 0)),
    id: toIdString(doc._id),
    eventId: clean(doc.eventId),
    eventSlug: clean(doc.eventSlug),
    eventTitle: clean(doc.eventTitle),
    campaignKind: normalizeEventCampaignKind(doc.campaignKind),
    name: clean(doc.name),
    subject: clean(doc.subject),
    preheader: clean(doc.preheader),
    htmlBody: doc.htmlBody || '',
    textBody: doc.textBody || '',
    visualBody: Array.isArray(doc.visualBody) ? doc.visualBody : [],
    status: normalizeEventCampaignStatus(doc.status),
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

export function mapDelivery(doc: DeliveryDoc): EventRegistrationDeliverySummary {
  return {
    id: toIdString(doc._id),
    campaignId: clean(doc.campaignId),
    eventId: clean(doc.eventId),
    registrationId: clean(doc.registrationId),
    email: normalizeEmail(doc.email),
    firstName: clean(doc.firstName),
    status: normalizeEventDeliveryStatus(doc.status),
    postmarkMessageId: clean(doc.postmarkMessageId),
    sentAt: toDateIsoOrNull(doc.sentAt),
    error: clean(doc.error),
    attempts: Math.max(0, Math.round(Number(doc.attempts || 0))),
    createdAt: toDateIsoOrNull(doc.createdAt),
    updatedAt: toDateIsoOrNull(doc.updatedAt)
  };
}
