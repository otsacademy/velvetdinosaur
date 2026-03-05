import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/pages.ts');

import type { Data } from '@measured/puck';
import { cacheLife, cacheTag, unstable_noStore } from 'next/cache';
import { connectDB } from '@/lib/db';
import { Page } from '@/models/Page';
import { defaultData } from '@/puck/defaults';
import { pageTags } from '@/lib/cache-tags';
import { isSiteChromeSlug } from '@/lib/site-chrome-slugs';
import { coreComponents } from '@/puck/registry-core';
import { storeBlocks } from '@/components/blocks/store';

type PageDoc = {
  slug: string;
  title?: string;
  data?: unknown;
  draftData?: unknown;
  publishedData?: unknown;
  draftUpdatedAt?: Date;
  publishedAt?: Date;
  status?: string;
  updatedAt?: Date;
};

const disablePageCache =
  process.env.VD_DISABLE_PAGE_CACHE === 'true' || process.env.VD_DISABLE_PAGE_CACHE === '1';
const isLhci = process.env.VD_LHCI === 'true' || process.env.NEXT_PUBLIC_LHCI === 'true';
const isEditorSmoke = Boolean(process.env.VD_EDITOR_SMOKE_TOKEN);
type CacheLifeProfile = 'default' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'max';

declare global {
  // eslint-disable-next-line no-var
  var vdEditorSmokePages: Map<string, PageDoc> | undefined;
}

const smokePages = (() => {
  if (!isEditorSmoke) return null;
  if (!globalThis.vdEditorSmokePages) {
    globalThis.vdEditorSmokePages = new Map();
  }
  return globalThis.vdEditorSmokePages;
})();

function getSmokePage(slug: string) {
  return smokePages?.get(slug) ?? null;
}

function ensureSmokePage(slug: string) {
  if (!smokePages) return null;
  const existing = smokePages.get(slug);
  if (existing) return existing;
  const now = new Date();
  const seeded: PageDoc = {
    slug,
    draftData: defaultData(slug),
    draftUpdatedAt: now,
    updatedAt: now,
    status: 'draft'
  };
  smokePages.set(slug, seeded);
  return seeded;
}

function listSmokePages() {
  if (!smokePages) return [];
  return Array.from(smokePages.values()).sort((a, b) => a.slug.localeCompare(b.slug));
}

function applyCacheLife(profile: CacheLifeProfile) {
  if (disablePageCache) {
    cacheLife('seconds');
    return;
  }
  cacheLife(profile as Parameters<typeof cacheLife>[0]);
}

function applyNoStore() {
  if (disablePageCache) {
    unstable_noStore();
  }
}

function resolvePublishedData(page: PageDoc | null): unknown | null {
  if (!page) return null;
  return page.publishedData ?? page.data ?? null;
}

function resolveDraftData(page: PageDoc | null): unknown | null {
  if (!page) return null;
  return page.draftData ?? page.publishedData ?? page.data ?? null;
}

function isPuckData(value: unknown): value is Data {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as { root?: unknown; content?: unknown };
  if (!maybe.root || typeof maybe.root !== 'object') return false;
  if (!Array.isArray(maybe.content)) return false;
  return true;
}

function hasRenderableContent(slug: string, data: Data) {
  if (isSiteChromeSlug(slug)) return true;
  const content = data.content as unknown[];
  if (!Array.isArray(content) || content.length === 0) return false;
  return content.some((item) => {
    if (!item || typeof item !== 'object') return false;
    const maybe = item as { type?: unknown };
    if (typeof maybe.type !== 'string' || maybe.type.trim().length === 0) return false;
    const type = maybe.type.trim();
    return Boolean((coreComponents as Record<string, unknown>)[type] || (storeBlocks as Record<string, unknown>)[type]);
  });
}

async function getPublishedPageDataUncached(slug: string): Promise<Data> {
  const conn = await connectDB();
  if (!conn) {
    if (smokePages) {
      const page = ensureSmokePage(slug);
      const data = resolvePublishedData(page);
      if (!isPuckData(data) || !hasRenderableContent(slug, data)) {
        return defaultData(slug);
      }
      return data;
    }
    return defaultData(slug);
  }
  const page = (await Page.findOne({ slug }).lean()) as PageDoc | null;
  const data = resolvePublishedData(page);
  if (!isPuckData(data) || !hasRenderableContent(slug, data)) {
    return defaultData(slug);
  }
  return data;
}

async function getPublishedPageDataCached(slug: string): Promise<Data> {
  'use cache';
  applyCacheLife('hours');
  cacheTag(pageTags.content);
  cacheTag(pageTags.published(slug));
  return getPublishedPageDataUncached(slug);
}

export async function getPublishedPageData(slug: string): Promise<Data> {
  if (isLhci) {
    return defaultData(slug);
  }
  if (disablePageCache) {
    applyNoStore();
    return getPublishedPageDataUncached(slug);
  }
  return getPublishedPageDataCached(slug);
}

async function getDraftPageDataUncached(slug: string): Promise<Data> {
  const conn = await connectDB();
  if (!conn) {
    if (smokePages) {
      const page = ensureSmokePage(slug);
      const data = resolveDraftData(page);
      if (!isPuckData(data) || !hasRenderableContent(slug, data)) {
        return defaultData(slug);
      }
      return data;
    }
    return defaultData(slug);
  }
  const page = (await Page.findOne({ slug }).lean()) as PageDoc | null;
  const data = resolveDraftData(page);
  if (!isPuckData(data) || !hasRenderableContent(slug, data)) {
    return defaultData(slug);
  }
  return data;
}

async function getDraftPageDataCached(slug: string): Promise<Data> {
  'use cache';
  applyCacheLife('minutes');
  cacheTag(pageTags.content);
  cacheTag(pageTags.draft(slug));
  return getDraftPageDataUncached(slug);
}

export async function getDraftPageData(slug: string): Promise<Data> {
  if (isLhci) {
    return defaultData(slug);
  }
  if (disablePageCache) {
    applyNoStore();
    return getDraftPageDataUncached(slug);
  }
  return getDraftPageDataCached(slug);
}

async function getPageRecordUncached(slug: string): Promise<PageDoc | null> {
  const conn = await connectDB();
  if (!conn) {
    if (smokePages) {
      return getSmokePage(slug);
    }
    return null;
  }
  return (await Page.findOne({ slug }).lean()) as PageDoc | null;
}

async function getPageRecordCached(slug: string): Promise<PageDoc | null> {
  'use cache';
  applyCacheLife('minutes');
  cacheTag(pageTags.content);
  cacheTag(pageTags.record(slug));
  return getPageRecordUncached(slug);
}

export async function getPageRecordFresh(slug: string): Promise<PageDoc | null> {
  return getPageRecordUncached(slug);
}

export async function getPageRecord(slug: string): Promise<PageDoc | null> {
  if (disablePageCache) {
    applyNoStore();
    return getPageRecordUncached(slug);
  }
  return getPageRecordCached(slug);
}

export async function saveDraftPageData(slug: string, draftData: unknown) {
  const conn = await connectDB();
  if (!conn) {
    if (smokePages) {
      const now = new Date();
      const existing = getSmokePage(slug);
      const next: PageDoc = {
        slug,
        draftData,
        draftUpdatedAt: now,
        updatedAt: now,
        status: 'draft',
        publishedData: existing?.publishedData,
        publishedAt: existing?.publishedAt,
        data: existing?.data,
        title: existing?.title
      };
      smokePages.set(slug, next);
      return next;
    }
    throw new Error('Database connection not available');
  }
  const existing = await Page.findOne({ slug });
  if (existing) {
    existing.draftData = draftData;
    existing.draftUpdatedAt = new Date();
    await existing.save();
    return existing;
  }
  return Page.create({ slug, draftData, draftUpdatedAt: new Date(), status: 'draft' });
}

export async function publishDraftPageData(slug: string) {
  const conn = await connectDB();
  if (!conn) {
    if (smokePages) {
      const existing = getSmokePage(slug);
      if (!existing) {
        throw new Error('Page not found');
      }
      const fallback = existing.draftData ?? existing.publishedData ?? existing.data;
      if (!fallback) {
        throw new Error('No draft to publish');
      }
      const now = new Date();
      const next: PageDoc = {
        ...existing,
        publishedData: fallback,
        publishedAt: now,
        updatedAt: now,
        status: 'published'
      };
      smokePages.set(slug, next);
      return next;
    }
    throw new Error('Database connection not available');
  }
  const existing = await Page.findOne({ slug });
  if (!existing) {
    throw new Error('Page not found');
  }
  if (!existing.draftData) {
    // Backward-compatible: allow publishing legacy `data` or already-published pages.
    const fallback = existing.publishedData ?? existing.data;
    if (!fallback) {
      throw new Error('No draft to publish');
    }
    existing.publishedData = fallback;
  } else {
    existing.publishedData = existing.draftData;
  }
  existing.publishedAt = new Date();
  existing.status = 'published';
  await existing.save();
  return existing;
}

export async function resetDraftPageData(slug: string) {
  const conn = await connectDB();
  if (!conn) {
    if (smokePages) {
      const existing = getSmokePage(slug);
      if (!existing) {
        return null;
      }
      const published = existing.publishedData ?? existing.data ?? null;
      if (!published) {
        return null;
      }
      const now = new Date();
      const next: PageDoc = {
        ...existing,
        draftData: published,
        draftUpdatedAt: now,
        updatedAt: now
      };
      smokePages.set(slug, next);
      return next;
    }
    throw new Error('Database connection not available');
  }
  const existing = await Page.findOne({ slug });
  if (!existing) {
    return null;
  }
  const published = existing.publishedData ?? existing.data ?? null;
  if (!published) {
    return null;
  }
  existing.draftData = published;
  existing.draftUpdatedAt = new Date();
  await existing.save();
  return existing;
}

async function listPagesUncached(options: { includeEmpty?: boolean } = {}) {
  const conn = await connectDB();
  if (!conn) {
    if (smokePages) {
      return listSmokePages();
    }
    return [];
  }
  const filter = options.includeEmpty
    ? {}
    : {
        $or: [
          { draftData: { $exists: true, $ne: null } },
          { publishedData: { $exists: true, $ne: null } },
          { data: { $exists: true, $ne: null } }
        ]
      };
  const pages = (await Page.find(filter)
    .sort({ slug: 1 })
    .select({ slug: 1, title: 1, updatedAt: 1, publishedAt: 1, draftUpdatedAt: 1 })
    .lean()) as unknown as Array<
    Pick<PageDoc, 'slug' | 'title' | 'draftUpdatedAt' | 'publishedAt'> & { updatedAt?: Date }
  >;
  return pages;
}

async function listPagesCached(options: { includeEmpty?: boolean } = {}) {
  'use cache';
  applyCacheLife('minutes');
  cacheTag(pageTags.list(options.includeEmpty));
  return listPagesUncached(options);
}

export async function listPages(options: { includeEmpty?: boolean } = {}) {
  if (disablePageCache) {
    applyNoStore();
    return listPagesUncached(options);
  }
  return listPagesCached(options);
}

async function listPublishedPageSlugsUncached() {
  const conn = await connectDB();
  if (!conn) {
    return [];
  }

  const pages = (await Page.find({
    $or: [
      { publishedData: { $exists: true, $ne: null } },
      { data: { $exists: true, $ne: null } }
    ]
  })
    .select({ slug: 1 })
    .lean()) as Array<{ slug?: string }>;

  return pages.map((page) => page.slug).filter((slug): slug is string => Boolean(slug));
}

async function listPublishedPageSlugsCached() {
  'use cache';
  applyCacheLife('hours');
  cacheTag(pageTags.content);
  return listPublishedPageSlugsUncached();
}

export async function listPublishedPageSlugs() {
  if (disablePageCache) {
    applyNoStore();
    return listPublishedPageSlugsUncached();
  }
  return listPublishedPageSlugsCached();
}
