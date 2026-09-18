import { NextResponse } from 'next/server';
import { getNewsletterMediaRecord, verifyNewsletterMedia } from '@/lib/newsletter/media-storage';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = await getNewsletterMediaRecord(id, 'image');
    if (record.mime !== 'image/jpeg' && record.mime !== 'image/png') throw new Error('Not an image.');
    const bytes = await verifyNewsletterMedia(record);
    return new NextResponse(new Uint8Array(bytes), { headers: {
      'Content-Type': record.mime, 'Content-Length': String(bytes.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff', ETag: `"${record.sha256}"`,
      'X-Robots-Tag': 'noindex',
    } });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
}
