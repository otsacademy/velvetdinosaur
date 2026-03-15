import { NextResponse } from 'next/server';
import { z } from 'zod';
import { trackServerConversion } from '@/lib/analytics';

const PayloadSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  source: z.string().trim().max(120).optional()
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = PayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Enter a valid email.' }, { status: 400 });
  }

  const { connectDB } = await import('@/lib/db');
  const { WaitlistSignup } = await import('@/models/WaitlistSignup');
  const { sendWaitlistSignupNotificationEmail } = await import('@/lib/email');

  await connectDB();

  const email = parsed.data.email;
  const source = parsed.data.source ?? null;
  const userAgent = req.headers.get('user-agent');

  try {
    // Create and notify only on first signup (no email spam on duplicates).
    await WaitlistSignup.create({ email, source, userAgent });
    await sendWaitlistSignupNotificationEmail({
      email,
      source,
      userAgent,
      createdAtIso: new Date().toISOString()
    });
    await trackServerConversion(req, {
      conversionName: 'waitlist_signup',
      metadata: {
        source,
        delivery: 'database-create'
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    // Duplicate key race or other db error.
    const msg = typeof error?.message === 'string' ? error.message : '';
    if (msg.includes('E11000')) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json(
      { ok: false, message: 'Unable to join right now. Try again soon.' },
      { status: 500 }
    );
  }
}
