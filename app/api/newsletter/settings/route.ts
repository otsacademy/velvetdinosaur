import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getNewsletterSettings, toPublicNewsletterSettings } from '@/lib/newsletter/settings';

export async function GET() {
  unstable_noStore();
  const settings = await getNewsletterSettings();
  return NextResponse.json({ settings: toPublicNewsletterSettings(settings) });
}
