import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/NewsletterCampaign.ts');

import { Schema, model, models } from 'mongoose';

const CAMPAIGN_STATUSES = ['draft', 'queued', 'sending', 'completed', 'cancelled'] as const;

const NewsletterCampaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    preheader: { type: String, default: '', trim: true },
    htmlBody: { type: String, required: true },
    textBody: { type: String, required: true },
    visualBody: { type: [Schema.Types.Mixed], default: [] },
    status: { type: String, enum: CAMPAIGN_STATUSES, default: 'draft', index: true },
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

NewsletterCampaignSchema.index({ createdAt: -1 });

export const NewsletterCampaign =
  models.NewsletterCampaign || model('NewsletterCampaign', NewsletterCampaignSchema);

export const newsletterCampaignStatuses = CAMPAIGN_STATUSES;
