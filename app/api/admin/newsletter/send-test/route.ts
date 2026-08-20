import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendNewsletterCampaignEmail } from '@/lib/email/newsletter-campaign';
import { getNewsletterCampaignById } from '@/lib/newsletter/campaigns';
import { getNewsletterPreferenceByEmail } from '@/lib/newsletter/consent';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import { clean } from '@/lib/newsletter/shared';

const Schema = z.object({
  toEmail: z.string().trim().email().optional(),
  firstName: z.string().trim().max(120).optional(),
  campaignId: z.string().trim().optional(),
  subject: z.string().trim().min(1).max(200).optional(),
  preheader: z.string().trim().max(200).optional(),
  htmlBody: z.string().optional(),
  textBody: z.string().optional()
});

export async function POST(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const targetEmail = clean(parsed.data.toEmail) || admin.email;
  const fromCampaignId = clean(parsed.data.campaignId);
  let subject = clean(parsed.data.subject);
  let preheader = clean(parsed.data.preheader);
  let htmlBody = parsed.data.htmlBody || '';
  let textBody = parsed.data.textBody || '';
  let campaignId = fromCampaignId || 'test-campaign';

  if (fromCampaignId) {
    const campaign = await getNewsletterCampaignById(fromCampaignId);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    subject = subject || campaign.subject;
    preheader = preheader || campaign.preheader;
    htmlBody = htmlBody || campaign.htmlBody;
    textBody = textBody || campaign.textBody;
    campaignId = campaign.id;
  }

  if (!subject || !htmlBody || !textBody) {
    return NextResponse.json({ error: 'Subject, HTML body, and text body are required' }, { status: 400 });
  }

  let resolvedFirstName = clean(parsed.data.firstName);
  if (!resolvedFirstName && targetEmail) {
    const preference = await getNewsletterPreferenceByEmail(targetEmail);
    resolvedFirstName = clean(preference?.firstName);
  }

  const result = await sendNewsletterCampaignEmail({
    to: targetEmail,
    firstName: resolvedFirstName,
    subject,
    preheader,
    htmlBody,
    textBody,
    campaignId,
    metadata: {
      sendType: 'test'
    }
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Failed to send test email' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, messageId: result.messageId, toEmail: targetEmail });
}
