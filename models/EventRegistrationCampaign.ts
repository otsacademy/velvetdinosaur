import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/EventRegistrationCampaign.ts');

import { Schema, model, models } from 'mongoose';

const EVENT_CAMPAIGN_KINDS = ['update', 'joining-instructions'] as const;
const EVENT_CAMPAIGN_STATUSES = ['draft', 'queued', 'sending', 'completed', 'cancelled'] as const;

const EventRegistrationCampaignSchema = new Schema(
  {
    eventId: { type: String, required: true, index: true },
    eventSlug: { type: String, required: true, trim: true, index: true },
    eventTitle: { type: String, required: true, trim: true },
    campaignKind: { type: String, enum: EVENT_CAMPAIGN_KINDS, default: 'update', index: true },
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    preheader: { type: String, default: '', trim: true },
    htmlBody: { type: String, required: true },
    textBody: { type: String, required: true },
    visualBody: { type: [Schema.Types.Mixed], default: [] },
    status: { type: String, enum: EVENT_CAMPAIGN_STATUSES, default: 'draft', index: true },
    scheduledAt: { type: Date, default: null, index: true },
    queuedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    createdByUserId: { type: String, required: true, index: true },
    recipientSnapshotCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    lastError: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

EventRegistrationCampaignSchema.index({ eventId: 1, createdAt: -1 });

export const EventRegistrationCampaign =
  models.EventRegistrationCampaign || model('EventRegistrationCampaign', EventRegistrationCampaignSchema);

export const eventRegistrationCampaignKinds = EVENT_CAMPAIGN_KINDS;
export const eventRegistrationCampaignStatuses = EVENT_CAMPAIGN_STATUSES;
