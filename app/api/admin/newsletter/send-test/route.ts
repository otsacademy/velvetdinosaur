import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { assertNewsletterTransportConfigured, sendNewsletterCampaignEmail } from '@/lib/email/newsletter-campaign';
import { retainNewsletterMediaImages } from '@/lib/newsletter/media';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import { assertNewsletterSendingAllowed } from '@/lib/newsletter/send-policy';
import { NewsletterRequestSchema, prepareNewsletterRequest } from '@/lib/newsletter/request-preparation';

export async function POST(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = NewsletterRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  try { assertNewsletterSendingAllowed(); } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
  try {
    assertNewsletterTransportConfigured();
    const prepared = await prepareNewsletterRequest(parsed.data, admin.email);
    // Images in an actual email must outlive temporary preview media, even when
    // provider acceptance becomes uncertain. Preview never calls this helper.
    await retainNewsletterMediaImages(prepared.manifest);
    const result = await sendNewsletterCampaignEmail({ ...prepared.input, metadata: { sendType: 'test' } });
    if (!result.ok) return NextResponse.json({ error: result.ambiguous ? 'Delivery outcome is uncertain. Check provider activity before retrying.' : result.error }, { status: 502 });
    return NextResponse.json({ ok: true, messageId: result.messageId, toEmail: prepared.input.to });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Test preparation failed' }, { status: 400 });
  }
}
