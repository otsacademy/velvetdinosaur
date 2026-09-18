import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import { selectNewsletterMedia } from '@/lib/newsletter/media';

const Schema = z.object({ assetKey: z.string().min(1).max(1024), kind: z.enum(['image', 'attachment']) });

export async function POST(request: Request) {
  if (!await requireAdminFromHeaders(request.headers)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Choose a Media Library file and a valid media type.' }, { status: 400 });
  try {
    const item = await selectNewsletterMedia(parsed.data.assetKey, parsed.data.kind);
    return NextResponse.json({ item }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The media could not be prepared.' }, { status: 400 });
  }
}
