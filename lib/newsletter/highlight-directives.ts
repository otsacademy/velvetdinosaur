import { createHash } from 'node:crypto';
import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/highlight-directives.ts');

import { connectDB } from '@/lib/db';
import { escapeHtml } from '@/lib/email-branding';
import { normalizeEventSlug } from '@/lib/events';
import { Event } from '@/models/Event';
import { NewsArticle } from '@/models/NewsArticle';

type DirectiveType = 'newsHighlights' | 'eventHighlights';

type NewsletterDirectiveInput = {
  htmlBody: string;
  textBody: string;
  appUrl: string;
};

type NewsletterDirectiveOutput = {
  htmlBody: string;
  textBody: string;
};

type NewsCard = {
  slug: string;
  title: string;
  desc: string;
  tag: string;
  dateLabel: string;
  imageUrl: string;
};

type EventCard = {
  slug: string;
  title: string;
  category: string;
  dateLabel: string;
  location: string;
  imageUrl: string;
};

type CacheEntry = {
  expiresAt: number;
  value: NewsletterDirectiveOutput;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 40;
const COMPILED_CACHE = new Map<string, CacheEntry>();
const DIRECTIVE_PATTERN = /\{\{(newsHighlights|eventHighlights)(?::([^}]+))?\}\}/g;
const DIRECTIVE_SCAN_PATTERN = /\{\{(?:newsHighlights|eventHighlights)(?::[^}]+)?\}\}/;

function parseSlugList(raw: string | undefined) {
  if (!raw) return [];
  const seen = new Set<string>();
  const output: string[] = [];
  for (const entry of raw.split(',')) {
    const normalized = normalizeEventSlug(entry || '');
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }
  return output;
}

function clip(value: string, max = 170) {
  const compact = (value || '').replace(/\s+/g, ' ').trim();
  if (!compact) return '';
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 1).trimEnd()}…`;
}

function toDateLabel(value: unknown, fallback: string) {
  const fallbackText = fallback.trim();
  const parsed = value instanceof Date ? value : typeof value === 'string' || typeof value === 'number' ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return fallbackText || 'Date TBA';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toEventDateLabel(start: unknown) {
  const parsed = start instanceof Date ? start : typeof start === 'string' || typeof start === 'number' ? new Date(start) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return 'Date TBA';
  const dateLabel = parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeLabel = parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${dateLabel} • ${timeLabel}`;
}

function joinUrl(baseUrl: string, path: string) {
  const base = (baseUrl || '').trim().replace(/\/+$/, '');
  if (!base) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function normalizeImageUrl(raw: unknown, appUrl: string) {
  if (typeof raw !== 'string') return '';
  const value = raw.trim();
  if (!value) return '';
  if (value.startsWith('https://') || value.startsWith('http://')) return value;
  if (value.startsWith('/')) return joinUrl(appUrl, value);
  return '';
}

async function loadNewsCards(slugs: string[]) {
  await connectDB();
  const rows = (await NewsArticle.find({
    $or: [{ status: 'published' as const }, { status: { $exists: false }, publishedAt: { $ne: null } }]
  })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(80)
    .select({ slug: 1, title: 1, desc: 1, tag: 1, date: 1, publishedAt: 1, img: 1 })
    .lean()) as Array<{
    slug?: unknown;
    title?: unknown;
    desc?: unknown;
    tag?: unknown;
    date?: unknown;
    publishedAt?: unknown;
    img?: unknown;
  }>;

  const mapped = rows
    .map((row) => ({
      slug: normalizeEventSlug(typeof row.slug === 'string' ? row.slug : ''),
      title: typeof row.title === 'string' ? row.title.trim() : '',
      desc: typeof row.desc === 'string' ? row.desc.trim() : '',
      tag: typeof row.tag === 'string' ? row.tag.trim() : '',
      dateLabel: toDateLabel(row.publishedAt, typeof row.date === 'string' ? row.date : ''),
      imageUrl: normalizeImageUrl(row.img, '')
    }))
    .filter((row) => row.slug && row.title);

  if (!slugs.length) return mapped.slice(0, 4);

  const lookup = new Map(mapped.map((item) => [item.slug, item]));
  return slugs.map((slug) => lookup.get(slug)).filter(Boolean) as NewsCard[];
}

async function loadEventCards(slugs: string[]) {
  await connectDB();
  const rows = (await Event.find({
    $or: [{ status: 'published' as const }, { status: { $exists: false }, publishedAt: { $ne: null } }]
  })
    .sort({ startDateTime: 1, createdAt: 1 })
    .limit(120)
    .select({ slug: 1, title: 1, category: 1, startDateTime: 1, venueName: 1, venueAddress: 1, locationType: 1, heroImage: 1 })
    .lean()) as Array<{
    slug?: unknown;
    title?: unknown;
    category?: unknown;
    startDateTime?: unknown;
    venueName?: unknown;
    venueAddress?: unknown;
    locationType?: unknown;
    heroImage?: unknown;
  }>;

  const now = Date.now();
  const mapped = rows
    .map((row) => {
      const locationType = typeof row.locationType === 'string' ? row.locationType.trim() : '';
      const venueName = typeof row.venueName === 'string' ? row.venueName.trim() : '';
      const venueAddress = typeof row.venueAddress === 'string' ? row.venueAddress.trim() : '';
      const location =
        locationType === 'virtual'
          ? 'Virtual'
          : locationType === 'hybrid'
            ? venueName
              ? `${venueName} (Hybrid)`
              : 'Hybrid'
            : venueName || venueAddress || 'Location TBA';
      return {
        slug: normalizeEventSlug(typeof row.slug === 'string' ? row.slug : ''),
        title: typeof row.title === 'string' ? row.title.trim() : '',
        category: typeof row.category === 'string' ? row.category.trim() : 'Event',
        dateLabel: toEventDateLabel(row.startDateTime),
        startDateMs:
          row.startDateTime instanceof Date
            ? row.startDateTime.getTime()
            : typeof row.startDateTime === 'string' || typeof row.startDateTime === 'number'
              ? new Date(row.startDateTime).getTime()
              : Number.NaN,
        location,
        imageUrl: normalizeImageUrl(row.heroImage, '')
      };
    })
    .filter((row) => row.slug && row.title);

  if (!slugs.length) {
    return mapped.filter((row) => Number.isFinite(row.startDateMs) && row.startDateMs >= now - 24 * 60 * 60 * 1000).slice(0, 4);
  }

  const lookup = new Map(mapped.map((item) => [item.slug, item]));
  return slugs.map((slug) => lookup.get(slug)).filter(Boolean) as EventCard[];
}

function renderNewsHtml(cards: NewsCard[], appUrl: string) {
  if (!cards.length) return '';
  const rows = cards
    .map((item) => {
      const href = joinUrl(appUrl, `/news/${encodeURIComponent(item.slug)}`);
      const imageUrl = normalizeImageUrl(item.imageUrl, appUrl) || joinUrl(appUrl, '/images/placeholder.svg');
      return [
        '<tr>',
        '<td style="padding:12px 0;border-bottom:1px solid #e5e7eb">',
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">',
        '<tr>',
        `<td width="170" valign="top" style="padding:0 12px 0 0"><a href="${escapeHtml(href)}"><img src="${escapeHtml(imageUrl)}" width="156" height="98" alt="${escapeHtml(item.title)}" style="display:block;border:0;border-radius:10px;width:100%;max-width:156px;height:auto;aspect-ratio:156/98;object-fit:cover;background:#f3f4f6" /></a></td>`,
        '<td valign="top">',
        `<a href="${escapeHtml(href)}" style="font-size:16px;line-height:24px;font-weight:600;color:#111827;text-decoration:none">${escapeHtml(item.title)}</a>`,
        `<p style="margin:6px 0 0 0;font-size:13px;line-height:20px;color:#374151">${escapeHtml(clip(item.desc, 180))}</p>`,
        `<p style="margin:6px 0 0 0;font-size:12px;line-height:18px;color:#6b7280">${escapeHtml(item.tag || 'News')} • ${escapeHtml(item.dateLabel)}</p>`,
        '</td>',
        '</tr>',
        '</table>',
        '</td>',
        '</tr>'
      ].join('');
    })
    .join('');

  return [
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;border-collapse:collapse">',
    '<tr><td style="padding:0 0 8px 0"><p style="margin:0;font-size:18px;line-height:24px;font-weight:700;color:#111827">From the Newsroom</p></td></tr>',
    rows,
    '</table>'
  ].join('');
}

function renderNewsText(cards: NewsCard[], appUrl: string) {
  if (!cards.length) return '';
  const lines = ['From the Newsroom'];
  for (const item of cards) {
    const href = joinUrl(appUrl, `/news/${encodeURIComponent(item.slug)}`);
    lines.push(`- ${item.title} (${item.dateLabel})`);
    if (item.desc.trim()) lines.push(`  ${clip(item.desc, 150)}`);
    lines.push(`  ${href}`);
  }
  return lines.join('\n');
}

function renderEventsHtml(cards: EventCard[], appUrl: string) {
  if (!cards.length) {
    const fallbackHref = joinUrl(appUrl, '/events');
    const fallbackImage = joinUrl(appUrl, '/images/event-poverty-conference.jpg');
    return [
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;border-collapse:collapse">',
      '<tr>',
      '<td style="padding:12px 0;border-bottom:1px solid #e5e7eb">',
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">',
      '<tr>',
      `<td width="170" valign="top" style="padding:0 12px 0 0"><a href="${escapeHtml(fallbackHref)}"><img src="${escapeHtml(fallbackImage)}" width="156" height="98" alt="Events" style="display:block;border:0;border-radius:10px;width:100%;max-width:156px;height:auto;aspect-ratio:156/98;object-fit:cover;background:#f3f4f6" /></a></td>`,
      '<td valign="top">',
      `<a href="${escapeHtml(fallbackHref)}" style="font-size:16px;line-height:24px;font-weight:600;color:#111827;text-decoration:none">Events Calendar</a>`,
      '<p style="margin:6px 0 0 0;font-size:13px;line-height:20px;color:#374151">New events are being finalized. View our events page for the latest schedule.</p>',
      '<p style="margin:4px 0 0 0;font-size:12px;line-height:18px;color:#6b7280">Dates announced soon</p>',
      '</td>',
      '</tr>',
      '</table>',
      '</td>',
      '</tr>',
      '</table>'
    ].join('');
  }
  const rows = cards
    .map((item) => {
      const href = joinUrl(appUrl, `/events/${encodeURIComponent(item.slug)}`);
      const imageUrl = normalizeImageUrl(item.imageUrl, appUrl) || joinUrl(appUrl, '/images/placeholder.svg');
      return [
        '<tr>',
        '<td style="padding:12px 0;border-bottom:1px solid #e5e7eb">',
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">',
        '<tr>',
        `<td width="170" valign="top" style="padding:0 12px 0 0"><a href="${escapeHtml(href)}"><img src="${escapeHtml(imageUrl)}" width="156" height="98" alt="${escapeHtml(item.title)}" style="display:block;border:0;border-radius:10px;width:100%;max-width:156px;height:auto;aspect-ratio:156/98;object-fit:cover;background:#f3f4f6" /></a></td>`,
        '<td valign="top">',
        `<a href="${escapeHtml(href)}" style="font-size:16px;line-height:24px;font-weight:600;color:#111827;text-decoration:none">${escapeHtml(item.title)}</a>`,
        `<p style="margin:6px 0 0 0;font-size:13px;line-height:20px;color:#374151">${escapeHtml(item.category)} • ${escapeHtml(item.dateLabel)}</p>`,
        `<p style="margin:4px 0 0 0;font-size:12px;line-height:18px;color:#6b7280">${escapeHtml(item.location)}</p>`,
        '</td>',
        '</tr>',
        '</table>',
        '</td>',
        '</tr>'
      ].join('');
    })
    .join('');

  return [
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;border-collapse:collapse">',
    rows,
    '</table>'
  ].join('');
}

function renderEventsText(cards: EventCard[], appUrl: string) {
  if (!cards.length) {
    const href = joinUrl(appUrl, '/events');
    return ['- Events Calendar (Dates announced soon)', '  New events are being finalized.', `  ${href}`].join('\n');
  }
  const lines: string[] = [];
  for (const item of cards) {
    const href = joinUrl(appUrl, `/events/${encodeURIComponent(item.slug)}`);
    lines.push(`- ${item.title} (${item.dateLabel})`);
    lines.push(`  ${item.location}`);
    lines.push(`  ${href}`);
  }
  return lines.join('\n');
}

async function replaceDirectivesInTemplate(
  template: string,
  renderer: (type: DirectiveType, slugs: string[]) => Promise<string>
) {
  if (!DIRECTIVE_SCAN_PATTERN.test(template)) return template;
  const pattern = new RegExp(DIRECTIVE_PATTERN.source, 'g');
  let cursor = 0;
  let output = '';
  let match = pattern.exec(template);
  while (match) {
    output += template.slice(cursor, match.index);
    const type = match[1] as DirectiveType;
    const slugs = parseSlugList(match[2]);
    output += await renderer(type, slugs);
    cursor = match.index + match[0].length;
    match = pattern.exec(template);
  }
  output += template.slice(cursor);
  return output;
}

function cacheKey(input: NewsletterDirectiveInput) {
  return createHash('sha1').update(`${input.appUrl}\n${input.htmlBody}\n${input.textBody}`).digest('hex');
}

function readCache(key: string) {
  const entry = COMPILED_CACHE.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    COMPILED_CACHE.delete(key);
    return null;
  }
  return entry.value;
}

function writeCache(key: string, value: NewsletterDirectiveOutput) {
  if (COMPILED_CACHE.size >= MAX_CACHE_ENTRIES) {
    const oldest = COMPILED_CACHE.keys().next().value as string | undefined;
    if (oldest) COMPILED_CACHE.delete(oldest);
  }
  COMPILED_CACHE.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
}

export async function resolveNewsletterHighlightDirectives(input: NewsletterDirectiveInput): Promise<NewsletterDirectiveOutput> {
  if (!DIRECTIVE_SCAN_PATTERN.test(input.htmlBody) && !DIRECTIVE_SCAN_PATTERN.test(input.textBody)) {
    return { htmlBody: input.htmlBody, textBody: input.textBody };
  }

  const key = cacheKey(input);
  const cached = readCache(key);
  if (cached) return cached;

  const newsRequests = new Map<string, Promise<NewsCard[]>>();
  const eventRequests = new Map<string, Promise<EventCard[]>>();
  const getNews = (slugs: string[]) => {
    const key = slugs.join(',');
    const existing = newsRequests.get(key);
    if (existing) return existing;
    const created = loadNewsCards(slugs);
    newsRequests.set(key, created);
    return created;
  };
  const getEvents = (slugs: string[]) => {
    const key = slugs.join(',');
    const existing = eventRequests.get(key);
    if (existing) return existing;
    const created = loadEventCards(slugs);
    eventRequests.set(key, created);
    return created;
  };

  const htmlBody = await replaceDirectivesInTemplate(input.htmlBody, async (type, slugs) => {
    if (type === 'newsHighlights') return renderNewsHtml(await getNews(slugs), input.appUrl);
    return renderEventsHtml(await getEvents(slugs), input.appUrl);
  });

  const textBody = await replaceDirectivesInTemplate(input.textBody, async (type, slugs) => {
    if (type === 'newsHighlights') return renderNewsText(await getNews(slugs), input.appUrl);
    return renderEventsText(await getEvents(slugs), input.appUrl);
  });

  const resolved = { htmlBody, textBody };
  writeCache(key, resolved);
  return resolved;
}
