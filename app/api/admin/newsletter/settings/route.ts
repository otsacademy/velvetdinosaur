import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import { getNewsletterSuppressionCounts } from '@/lib/newsletter/suppression';
import { getNewsletterSettings, updateNewsletterSettings } from '@/lib/newsletter/settings';

const SettingsPatchSchema = z.object({
  requireDoubleOptIn: z.boolean().optional(),
  enableHoneypot: z.boolean().optional(),
  minSecondsToSubmit: z.number().int().min(0).max(30).optional(),
  rateLimitPerIpPerMinute: z.number().int().min(1).max(300).optional(),
  rateLimitPerIpPerHour: z.number().int().min(10).max(5000).optional(),
  rateLimitPerEmailPerDay: z.number().int().min(1).max(200).optional(),
  requireCaptcha: z.boolean().optional(),
  captchaProvider: z.enum(['none', 'turnstile']).optional(),
  turnstileSiteKey: z.string().trim().max(300).optional(),
  turnstileSecretKey: z.string().trim().max(300).optional(),
  pendingTokenTtlMinutes: z.number().int().min(10).max(60 * 24 * 14).optional(),
  resendConfirmationCooldownMinutes: z.number().int().min(1).max(1440).optional(),
  blockSuppressedAddresses: z.boolean().optional()
});

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [settings, suppression] = await Promise.all([
    getNewsletterSettings(),
    getNewsletterSuppressionCounts()
  ]);
  return NextResponse.json({ settings, suppression });
}

export async function PATCH(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = SettingsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const current = await getNewsletterSettings();
  const next = await updateNewsletterSettings({
    ...current,
    ...parsed.data
  });
  return NextResponse.json({ settings: next });
}
