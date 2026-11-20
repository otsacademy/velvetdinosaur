import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/event-registration/campaigns.ts');

import { connectDB } from '@/lib/db';
import { getEventRegistrationContextById } from '@/lib/event-registration/event-context';
import { buildDefaultEventCampaignTemplateContent } from '@/lib/event-registration/default-campaign-template';
import {
  clean,
  normalizeEventCampaignKind,
  normalizeEventDeliveryStatus,
  type EventCampaignKind,
  type EventDeliveryStatus
} from '@/lib/event-registration/shared';
import { getSystemEmailTemplateEditorState } from '@/lib/system-email-templates';
import { EventRegistrationCampaign } from '@/models/EventRegistrationCampaign';
import { EventRegistrationDelivery } from '@/models/EventRegistrationDelivery';

import { mapCampaign, mapDelivery, type CampaignDoc, type DeliveryDoc } from "./campaign-types";
export type { EventRegistrationCampaignSummary, EventRegistrationDeliverySummary } from "./campaign-types";
export { queueEventRegistrationCampaign, cancelEventRegistrationCampaign, unscheduleEventRegistrationCampaign } from "./campaign-lifecycle";
export { dispatchQueuedEventRegistrationCampaigns } from "./dispatch";
const TEMPLATE_KEY_BY_KIND = {
  update: 'event-registration-update',
  'joining-instructions': 'event-registration-joining-instructions'
} as const;

export function buildDefaultEventCampaignContent(kind: EventCampaignKind) {
  return buildDefaultEventCampaignTemplateContent(normalizeEventCampaignKind(kind));
}

export async function getEventRegistrationCampaignComposerDefaults(kind: EventCampaignKind) {
  const normalizedKind = normalizeEventCampaignKind(kind);
  const fallback = buildDefaultEventCampaignContent(normalizedKind);
  try {
    const templates = await getSystemEmailTemplateEditorState();
    const template = templates.find((item) => item.key === TEMPLATE_KEY_BY_KIND[normalizedKind]);
    if (!template) return fallback;
    return {
      htmlBody: template.initialHtml || fallback.htmlBody,
      textBody: template.initialText || fallback.textBody
    };
  } catch {
    return fallback;
  }
}

export async function listEventRegistrationCampaigns(options?: { eventId?: string | null; limit?: number }) {
  await connectDB();
  const limit = Math.max(1, Math.min(200, Math.round(options?.limit || 80)));
  const query: Record<string, unknown> = {};
  const eventId = clean(options?.eventId);
  if (eventId) query.eventId = eventId;
  const rows = (await EventRegistrationCampaign.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()) as CampaignDoc[];
  return rows.map(mapCampaign);
}

export async function getEventRegistrationCampaignById(campaignId: string) {
  await connectDB();
  const row = (await EventRegistrationCampaign.findById(clean(campaignId)).lean()) as CampaignDoc | null;
  return row ? mapCampaign(row) : null;
}

export async function listEventRegistrationDeliveries(options?: {
  eventId?: string | null;
  campaignId?: string | null;
  status?: EventDeliveryStatus | 'all';
  q?: string | null;
  limit?: number;
}) {
  await connectDB();
  const limit = Math.max(1, Math.min(2000, Math.round(options?.limit || 400)));
  const query: Record<string, unknown> = {};
  const eventId = clean(options?.eventId);
  const campaignId = clean(options?.campaignId);
  const q = clean(options?.q);
  const status = options?.status;

  if (eventId) query.eventId = eventId;
  if (campaignId) query.campaignId = campaignId;
  if (status && status !== 'all') query.status = normalizeEventDeliveryStatus(status);
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { email: { $regex: safe, $options: 'i' } },
      { firstName: { $regex: safe, $options: 'i' } }
    ];
  }

  const rows = (await EventRegistrationDelivery.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()) as DeliveryDoc[];
  return rows.map(mapDelivery);
}

export async function createEventRegistrationCampaignDraft(input: {
  eventId: string;
  campaignKind: EventCampaignKind;
  name: string;
  subject: string;
  preheader?: string;
  htmlBody: string;
  textBody: string;
  visualBody?: unknown[];
  createdByUserId: string;
}) {
  await connectDB();
  const eventContext = await getEventRegistrationContextById(input.eventId);
  if (!eventContext) return null;

  const created = await EventRegistrationCampaign.create({
    eventId: eventContext.id,
    eventSlug: eventContext.slug,
    eventTitle: eventContext.title,
    campaignKind: normalizeEventCampaignKind(input.campaignKind),
    name: clean(input.name),
    subject: clean(input.subject),
    preheader: clean(input.preheader),
    htmlBody: input.htmlBody,
    textBody: input.textBody,
    visualBody: Array.isArray(input.visualBody) ? input.visualBody : [],
    createdByUserId: clean(input.createdByUserId)
  });

  return mapCampaign(created.toObject() as CampaignDoc);
}

export async function updateEventRegistrationCampaignDraft(input: {
  campaignId: string;
  campaignKind: EventCampaignKind;
  name: string;
  subject: string;
  preheader?: string;
  htmlBody: string;
  textBody: string;
  visualBody?: unknown[];
}) {
  await connectDB();
  const updated = (await EventRegistrationCampaign.findOneAndUpdate(
    {
      _id: clean(input.campaignId),
      status: 'draft'
    },
    {
      $set: {
        campaignKind: normalizeEventCampaignKind(input.campaignKind),
        name: clean(input.name),
        subject: clean(input.subject),
        preheader: clean(input.preheader),
        htmlBody: input.htmlBody,
        textBody: input.textBody,
        visualBody: Array.isArray(input.visualBody) ? input.visualBody : []
      }
    },
    { new: true }
  ).lean()) as CampaignDoc | null;

  return updated ? mapCampaign(updated) : null;
}
