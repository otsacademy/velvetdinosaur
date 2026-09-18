import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  cancelNewsletterCampaign,
  createNewsletterCampaignDraft,
  listNewsletterCampaigns,
  queueNewsletterCampaign,
  unscheduleNewsletterCampaign,
  updateNewsletterCampaignDraft
} from '@/lib/newsletter/campaigns';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import { NewsletterAttachmentSchema } from '@/lib/newsletter/request-preparation';
import { clean } from '@/lib/newsletter/shared';

const CreateDraftSchema = z.object({
  action: z.literal('create_draft'),
  name: z.string().trim().min(1).max(160),
  subject: z.string().trim().min(1).max(200),
  preheader: z.string().trim().max(200).optional(),
  htmlBody: z.string().min(1).max(2_000_000),
  textBody: z.string().min(1).max(2_000_000),
  visualBody: z.array(z.unknown()).optional(),
  bodySource: z.enum(['visual', 'html', 'text']).optional(),
  attachments: z.array(NewsletterAttachmentSchema).max(5).optional()
});

const UpdateDraftSchema = z.object({
  action: z.literal('update_draft'),
  campaignId: z.string().trim().regex(/^[a-f\d]{24}$/i),
  name: z.string().trim().min(1).max(160),
  subject: z.string().trim().min(1).max(200),
  preheader: z.string().trim().max(200).optional(),
  htmlBody: z.string().min(1).max(2_000_000),
  textBody: z.string().min(1).max(2_000_000),
  visualBody: z.array(z.unknown()).optional(),
  bodySource: z.enum(['visual', 'html', 'text']).optional(),
  attachments: z.array(NewsletterAttachmentSchema).max(5).optional()
});

const QueueSchema = z.object({
  action: z.literal('queue'),
  campaignId: z.string().trim().regex(/^[a-f\d]{24}$/i),
  scheduledAt: z.string().trim().optional()
});

const CancelSchema = z.object({
  action: z.literal('cancel'),
  campaignId: z.string().trim().regex(/^[a-f\d]{24}$/i)
});

const UnscheduleSchema = z.object({
  action: z.literal('unschedule'),
  campaignId: z.string().trim().regex(/^[a-f\d]{24}$/i)
});

const ActionSchema = z.discriminatedUnion('action', [
  CreateDraftSchema,
  UpdateDraftSchema,
  QueueSchema,
  CancelSchema,
  UnscheduleSchema
]);

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || 50)));
  const campaigns = await listNewsletterCampaigns(limit);
  return NextResponse.json({ items: campaigns });
}

export async function POST(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
  if (parsed.data.action === 'create_draft') {
    const item = await createNewsletterCampaignDraft({
      name: parsed.data.name,
      subject: parsed.data.subject,
      preheader: parsed.data.preheader,
      htmlBody: parsed.data.htmlBody,
      textBody: parsed.data.textBody,
      visualBody: parsed.data.visualBody,
      bodySource: parsed.data.bodySource,
      attachments: parsed.data.attachments,
      createdByUserId: admin.id
    });
    return NextResponse.json({ item });
  }

  if (parsed.data.action === 'update_draft') {
    const item = await updateNewsletterCampaignDraft({
      campaignId: parsed.data.campaignId,
      name: parsed.data.name,
      subject: parsed.data.subject,
      preheader: parsed.data.preheader,
      htmlBody: parsed.data.htmlBody,
      textBody: parsed.data.textBody,
      visualBody: parsed.data.visualBody,
      bodySource: parsed.data.bodySource,
      attachments: parsed.data.attachments
    });
    if (!item) {
      return NextResponse.json({ error: 'Campaign not found or not editable' }, { status: 404 });
    }
    return NextResponse.json({ item });
  }

  if (parsed.data.action === 'queue') {
    const scheduledAt = clean(parsed.data.scheduledAt);
    const item = await queueNewsletterCampaign({
      campaignId: parsed.data.campaignId,
      scheduledAt: scheduledAt || null
    });
    if (!item) {
      return NextResponse.json({ error: 'Campaign not found or cannot be queued' }, { status: 404 });
    }
    return NextResponse.json({ item });
  }

  if (parsed.data.action === 'unschedule') {
    const item = await unscheduleNewsletterCampaign(parsed.data.campaignId);
    if (!item) {
      return NextResponse.json({ error: 'Campaign not found or cannot be unscheduled' }, { status: 404 });
    }
    return NextResponse.json({ item });
  }

  const item = await cancelNewsletterCampaign(parsed.data.campaignId);
  if (!item) {
    return NextResponse.json({ error: 'Campaign not found or cannot be cancelled' }, { status: 404 });
  }
  return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Campaign update failed' }, { status: 400 });
  }
}
