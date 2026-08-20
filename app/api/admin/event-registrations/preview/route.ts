import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { renderEventRegistrationCampaignEmail } from '@/lib/email/event-registration-campaign';
import {
  getEventRegistrationCampaignById
} from '@/lib/event-registration/campaigns';
import { getEventRegistrationContextById } from '@/lib/event-registration/event-context';
import { getEventRegistrationByEmail } from '@/lib/event-registration/registrations';
import { clean } from '@/lib/event-registration/shared';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';

const Schema = z.object({
  eventId: z.string().trim().optional(),
  campaignId: z.string().trim().optional(),
  campaignKind: z.enum(['update', 'joining-instructions']).optional(),
  toEmail: z.string().trim().email().optional(),
  firstName: z.string().trim().max(120).optional(),
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
  let eventId = clean(parsed.data.eventId);
  let subject = clean(parsed.data.subject);
  let preheader = clean(parsed.data.preheader);
  let htmlBody = parsed.data.htmlBody || '';
  let textBody = parsed.data.textBody || '';
  let campaignId = fromCampaignId || 'preview-campaign';

  if (fromCampaignId) {
    const campaign = await getEventRegistrationCampaignById(fromCampaignId);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    eventId = eventId || campaign.eventId;
    subject = subject || campaign.subject;
    preheader = preheader || campaign.preheader;
    htmlBody = htmlBody || campaign.htmlBody;
    textBody = textBody || campaign.textBody;
    campaignId = campaign.id;
  }

  if (!eventId || !subject || !htmlBody || !textBody) {
    return NextResponse.json({ error: 'Event, subject, HTML body, and text body are required' }, { status: 400 });
  }

  const eventContext = await getEventRegistrationContextById(eventId);
  if (!eventContext) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  let resolvedFirstName = clean(parsed.data.firstName);
  if (!resolvedFirstName && targetEmail) {
    const registration = await getEventRegistrationByEmail(eventId, targetEmail);
    resolvedFirstName = clean(registration?.firstName);
  }

  const rendered = await renderEventRegistrationCampaignEmail({
    to: targetEmail,
    fullName: resolvedFirstName,
    subject,
    preheader,
    htmlBody,
    textBody,
    campaignId,
    event: {
      slug: eventContext.slug,
      title: eventContext.title,
      dateLabel: eventContext.dateLabel,
      location: `${eventContext.venue} ${eventContext.location}`.trim(),
      joiningInstructions: eventContext.joiningInstructions
    }
  });

  if (!rendered) {
    return NextResponse.json({ error: 'Preview recipient is required' }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    toEmail: rendered.toEmail,
    subject: rendered.subject,
    preheader: rendered.preheader,
    htmlBody: rendered.htmlBody,
    textBody: rendered.textBody
  });
}
