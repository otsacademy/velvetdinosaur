import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { previewSlugToPathname } from '@/lib/review/pathname-slug';
import { getExistingSessionReviewToken } from '@/lib/security/review-links';

function sanitizeSlug(input: string) {
  const slug = (input || '').trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return slug;
}

export async function GET(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    // Keep this endpoint non-erroring for anonymous page views to avoid noisy
    // console/network warnings while preserving access control.
    return NextResponse.json({ ok: false, error: 'Sign in is required.' });
  }

  const { searchParams } = new URL(request.url);
  const slug = sanitizeSlug(searchParams.get('slug') || '');
  if (!slug) {
    return NextResponse.json({ ok: false, error: 'Missing review page identifier.' }, { status: 400 });
  }

  if (!previewSlugToPathname(slug)) {
    return NextResponse.json({ ok: false, error: 'Invalid review page identifier.' }, { status: 400 });
  }

  const resolved = await getExistingSessionReviewToken({ slug });
  if (!resolved?.token) {
    return NextResponse.json({ ok: false, error: 'No active review link.' });
  }

  return NextResponse.json({
    ok: true,
    reviewToken: resolved.token
  });
}
