import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import { Event } from '@/models/Event';
import { NewsArticle } from '@/models/NewsArticle';

type OptionItem = {
  slug: string;
  title: string;
  dateLabel: string;
};

function normalizeSlug(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function normalizeTitle(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function toDateLabel(value: unknown, mode: 'future' | 'recent') {
  const parsed =
    value instanceof Date
      ? value
      : typeof value === 'string' || typeof value === 'number'
        ? new Date(value)
        : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return mode === 'future' ? 'Date TBA' : 'Recently published';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const now = Date.now();

  const newsRows = (await NewsArticle.find({
    $or: [{ status: 'published' as const }, { status: { $exists: false }, publishedAt: { $ne: null } }]
  })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(80)
    .select({ slug: 1, title: 1, publishedAt: 1, date: 1 })
    .lean()) as Array<{
    slug?: unknown;
    title?: unknown;
    publishedAt?: unknown;
    date?: unknown;
  }>;

  const eventRows = (await Event.find({
    $or: [{ status: 'published' as const }, { status: { $exists: false }, publishedAt: { $ne: null } }]
  })
    .sort({ startDateTime: 1, createdAt: 1 })
    .limit(120)
    .select({ slug: 1, title: 1, startDateTime: 1 })
    .lean()) as Array<{
    slug?: unknown;
    title?: unknown;
    startDateTime?: unknown;
  }>;

  const news: OptionItem[] = newsRows
    .map((row) => ({
      slug: normalizeSlug(row.slug),
      title: normalizeTitle(row.title),
      dateLabel: toDateLabel(row.publishedAt || row.date, 'recent')
    }))
    .filter((item) => item.slug && item.title)
    .slice(0, 40);

  const events: OptionItem[] = eventRows
    .map((row) => {
      const parsed =
        row.startDateTime instanceof Date
          ? row.startDateTime.getTime()
          : typeof row.startDateTime === 'string' || typeof row.startDateTime === 'number'
            ? new Date(row.startDateTime).getTime()
            : Number.NaN;
      return {
        slug: normalizeSlug(row.slug),
        title: normalizeTitle(row.title),
        dateLabel: toDateLabel(row.startDateTime, 'future'),
        startsAtMs: parsed
      };
    })
    .filter((item) => item.slug && item.title)
    .filter((item) => Number.isFinite(item.startsAtMs) && item.startsAtMs >= now - 24 * 60 * 60 * 1000)
    .slice(0, 40)
    .map(({ startsAtMs: _startsAtMs, ...item }) => item);

  return NextResponse.json({ news, events });
}
