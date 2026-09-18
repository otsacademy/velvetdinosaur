import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { renderNewsletterCampaignEmail } from '@/lib/email/newsletter-campaign';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import { NewsletterRequestSchema, prepareNewsletterRequest } from '@/lib/newsletter/request-preparation';

export async function POST(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = NewsletterRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  try {
    const prepared = await prepareNewsletterRequest(parsed.data, admin.email);
    const rendered = await renderNewsletterCampaignEmail(prepared.input, { inlineSocialIcons: false });
    if (!rendered) return NextResponse.json({ error: 'Preview recipient is required' }, { status: 400 });
    return NextResponse.json({ ok: true, toEmail: rendered.toEmail, subject: rendered.subject, preheader: rendered.preheader,
      htmlBody: rendered.htmlBody, textBody: rendered.textBody, attachments: prepared.attachments.map(({ assetKey, name, mime, size }) => ({ assetKey, name, mime, size })) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Preview preparation failed' }, { status: 400 });
  }
}
