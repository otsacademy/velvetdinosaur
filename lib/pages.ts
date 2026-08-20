import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/pages.ts');
import { randomUUID } from 'node:crypto';
import { cacheLife, cacheTag, unstable_noStore } from 'next/cache';
import { serializePageOwnership, type PageOwnershipInput } from '@/lib/page-ownership';
import {
  ensureSmokePage,
  getPageSmokeStore,
  getSmokePage,
  isPuckData,
  listSmokePages,
  nextRevision,
  normalizeRevision,
  type PageListRecord,
  resolveDraftData,
  resolvePublishedData,
  type PageDoc
} from '@/lib/pages-shared';
import { connectDB } from '@/lib/db';
import { folderForPageInlineMedia, rewriteInlineMediaForStorage } from '@/lib/inline-media.server';
import { Page } from '@/models/Page';
import type { Data } from '@puckeditor/core';
import { defaultData } from '@/puck/defaults';
import { pageTags } from '@/lib/cache-tags';
import { normalizePageDataForSlug } from '@/lib/puck/page-data-normalizers';
import { SITE_PAGE_DEFS, sitePageFallbackTitle } from '@/lib/site-pages';
import { isEditorSmokeEnabled } from '@/lib/security/editor-smoke';
import { getUserProfileByUserId } from '@/lib/user-profile';
const disablePageCache =
  process.env.VD_DISABLE_PAGE_CACHE === 'true' || process.env.VD_DISABLE_PAGE_CACHE === '1';
const isLhci = process.env.VD_LHCI === 'true' || process.env.NEXT_PUBLIC_LHCI === 'true';
const isEditorSmoke = isEditorSmokeEnabled();
type CacheLifeProfile = 'default' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'max';
const smokePages = getPageSmokeStore(isEditorSmoke);
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
async function resolveDraftOwnership(
  existing: Pick<PageDoc, 'primaryChapterSlug' | 'chapterSlugs'> | null,
  actorUserId?: string | null,
  override?: PageOwnershipInput
) {
  if (override !== undefined) {
    return serializePageOwnership(override);
  }
  if (existing) {
    return serializePageOwnership(existing);
  }
  const profile = await getUserProfileByUserId(actorUserId);
  return serializePageOwnership(profile);
}
async function rewritePageInlineMediaForStorage(slug: string, data: unknown) {
  const result = await rewriteInlineMediaForStorage(data, {
    folder: folderForPageInlineMedia(slug),
    label: `page:${slug}`
  });
  return result.value;
}
function setFallbackPagePayload(
  existing: { draftData?: unknown; publishedData?: unknown; data?: unknown },
  value: unknown
) {
  if (existing.draftData !== undefined && existing.draftData !== null) {
    existing.draftData = value;
    return;
  }
  if (existing.publishedData !== undefined && existing.publishedData !== null) {
    existing.publishedData = value;
    return;
  }
  existing.data = value;
}
async function getPublishedPageDataUncached(slug: string): Promise<Data> {
  const conn = await connectDB();
  if (!conn) {
    if (smokePages) {
      const page = ensureSmokePage(smokePages, slug);
      const data = resolvePublishedData(page);
      return isPuckData(data) ? data : defaultData(slug);
    }
    return defaultData(slug);
  }
  const page = (await Page.findOne({ slug }).lean()) as PageDoc | null;
  const data = resolvePublishedData(page);
  return isPuckData(data) ? normalizePageDataForSlug(slug, data) : defaultData(slug);
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
  if (disablePageCache || isEditorSmoke) {
    applyNoStore();
    return getPublishedPageDataUncached(slug);
  }
  return getPublishedPageDataCached(slug);
}
async function getDraftPageDataUncached(slug: string): Promise<Data> {
  const conn = await connectDB();
  if (!conn) {
    if (smokePages) {
      const page = ensureSmokePage(smokePages, slug);
      const data = resolveDraftData(page);
      return isPuckData(data) ? data : defaultData(slug);
    }
    return defaultData(slug);
  }
  const page = (await Page.findOne({ slug }).lean()) as PageDoc | null;
  const data = resolveDraftData(page);
  return isPuckData(data) ? normalizePageDataForSlug(slug, data) : defaultData(slug);
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
  if (disablePageCache || isEditorSmoke) {
    applyNoStore();
    return getDraftPageDataUncached(slug);
  }
  return getDraftPageDataCached(slug);
}
async function getPageRecordUncached(slug: string): Promise<PageDoc | null> {
  const conn = await connectDB();
  if (!conn) {
    if (smokePages) {
      return getSmokePage(smokePages, slug);
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
  if (disablePageCache || isEditorSmoke) {
    applyNoStore();
    return getPageRecordUncached(slug);
  }
  return getPageRecordCached(slug);
}
export async function saveDraftPageData(
  slug: string,
  draftData: unknown,
  actorUserId?: string | null,
  ownershipOverride?: PageOwnershipInput
) {
  const conn = await connectDB();
  if (!conn) {
    if (smokePages) {
      const now = new Date();
      const existing = getSmokePage(smokePages, slug);
      const revision = nextRevision(existing?.revision);
      const ownership = await resolveDraftOwnership(existing, actorUserId, ownershipOverride);
      const next: PageDoc = {
        slug,
        draftData,
        draftUpdatedAt: now,
        updatedAt: now,
        revision,
        status: 'draft',
        publishedData: existing?.publishedData,
        publishedAt: existing?.publishedAt,
        data: existing?.data,
        title: existing?.title,
        history: existing?.history,
        lastRejection: existing?.lastRejection ?? null,
        primaryChapterSlug: ownership.primaryChapterSlug,
        chapterSlugs: ownership.chapterSlugs,
        createdByUserId: existing?.createdByUserId ?? actorUserId ?? null,
        updatedByUserId: actorUserId ?? existing?.updatedByUserId ?? null,
        pendingPublishRequest: null
      };
      smokePages.set(slug, next);
      return next;
    }
    throw new Error('Database connection not available');
  }
  const safeDraftData = await rewritePageInlineMediaForStorage(slug, draftData);
  const existing = await Page.findOne({ slug });
  if (existing) {
    const ownership = await resolveDraftOwnership(existing, actorUserId, ownershipOverride);
    existing.draftData = safeDraftData;
    existing.draftUpdatedAt = new Date();
    existing.status = 'draft';
    existing.revision = nextRevision(existing.revision);
    existing.pendingPublishRequest = null;
    existing.primaryChapterSlug = ownership.primaryChapterSlug;
    existing.chapterSlugs = ownership.chapterSlugs;
    if (!existing.createdByUserId && actorUserId) {
      existing.createdByUserId = actorUserId;
    }
    if (actorUserId) {
      existing.updatedByUserId = actorUserId;
    }
    await existing.save();
    return existing;
  }
  const ownership = await resolveDraftOwnership(null, actorUserId, ownershipOverride);
  return Page.create({
    slug,
    draftData: safeDraftData,
    draftUpdatedAt: new Date(),
    revision: 1,
    pendingPublishRequest: null,
    status: 'draft',
    primaryChapterSlug: ownership.primaryChapterSlug,
    chapterSlugs: ownership.chapterSlugs,
    createdByUserId: actorUserId ?? null,
    updatedByUserId: actorUserId ?? null
  });
}
export async function requestPagePublishApproval(
  slug: string,
  actor?: {
    userId?: string | null;
    email?: string | null;
    name?: string | null;
  }
) {
  const now = new Date();
  const conn = await connectDB();
  if (!conn) {
    if (smokePages) {
      const existing = getSmokePage(smokePages, slug);
      if (!existing) {
        throw new Error('Page not found');
      }
      const fallback = existing.draftData ?? existing.publishedData ?? existing.data;
      if (!fallback) {
        throw new Error('No draft to publish');
      }
      const currentRevision = normalizeRevision(existing.revision);
      if (
        existing.pendingPublishRequest?.requestedAt &&
        normalizeRevision(existing.pendingPublishRequest.baseRevision) === currentRevision
      ) {
        return existing;
      }
      const requestPayload = {
        requestId: randomUUID(),
        baseRevision: currentRevision,
        requestedAt: now,
        requestedByUserId: actor?.userId ?? null,
        requestedByEmail: actor?.email ?? null,
        requestedByName: actor?.name ?? null
      };
      const next: PageDoc = {
        ...existing,
        updatedAt: now,
        updatedByUserId: actor?.userId ?? existing.updatedByUserId ?? null,
        lastRejection: null,
        pendingPublishRequest: requestPayload
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
  let fallback = existing.draftData ?? existing.publishedData ?? existing.data;
  if (!fallback) {
    throw new Error('No draft to publish');
  }
  fallback = await rewritePageInlineMediaForStorage(slug, fallback);
  setFallbackPagePayload(existing, fallback);
  const currentRevision = normalizeRevision(existing.revision);
  if (
    existing.pendingPublishRequest?.requestedAt &&
    normalizeRevision(existing.pendingPublishRequest.baseRevision) === currentRevision
  ) {
    return existing;
  }
  const requestPayload = {
    requestId: randomUUID(),
    baseRevision: currentRevision,
    requestedAt: now,
    requestedByUserId: actor?.userId ?? null,
    requestedByEmail: actor?.email ?? null,
    requestedByName: actor?.name ?? null
  };
  existing.pendingPublishRequest = requestPayload;
  existing.lastRejection = null;
  if (actor?.userId) {
    existing.updatedByUserId = actor.userId;
    if (!existing.createdByUserId) {
      existing.createdByUserId = actor.userId;
    }
  }
  await existing.save();
  return existing;
}
export async function publishDraftPageData(
  slug: string,
  actorUserId?: string | null,
  options?: { expectedRequestId?: string | null; expectedBaseRevision?: number | null }
) {
  const conn = await connectDB();
  if (!conn) {
    if (smokePages) {
      const existing = getSmokePage(smokePages, slug);
      if (!existing) {
        throw new Error('Page not found');
      }
      const currentRevision = normalizeRevision(existing.revision);
      if (
        options?.expectedRequestId &&
        (existing.pendingPublishRequest?.requestId !== options.expectedRequestId ||
          normalizeRevision(existing.pendingPublishRequest?.baseRevision) !==
            normalizeRevision(options.expectedBaseRevision))
      ) {
        throw new Error('Page approval request is stale');
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
        revision: nextRevision(currentRevision),
        updatedByUserId: actorUserId ?? existing.updatedByUserId ?? null,
        pendingPublishRequest: null,
        lastRejection: null,
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
  const currentRevision = normalizeRevision(existing.revision);
  if (
    options?.expectedRequestId &&
    (existing.pendingPublishRequest?.requestId !== options.expectedRequestId ||
      normalizeRevision(existing.pendingPublishRequest?.baseRevision) !==
        normalizeRevision(options.expectedBaseRevision))
  ) {
    throw new Error('Page approval request is stale');
  }
  let fallback = existing.draftData ?? existing.publishedData ?? existing.data;
  if (!fallback) {
    throw new Error('No draft to publish');
  }
  fallback = await rewritePageInlineMediaForStorage(slug, fallback);
  const now = new Date();
  const query: Record<string, unknown> = {
    slug,
    revision: currentRevision === 1 ? { $in: [1, null] } : currentRevision,
  };
  if (options?.expectedRequestId) {
    query['pendingPublishRequest.requestId'] = options.expectedRequestId;
    query['pendingPublishRequest.baseRevision'] = normalizeRevision(options.expectedBaseRevision);
  }
  const setPatch: Record<string, unknown> = {
    publishedData: fallback,
    publishedAt: now,
    pendingPublishRequest: null,
    lastRejection: null,
    status: 'published',
  };
  if (existing.draftData !== undefined && existing.draftData !== null) {
    setPatch.draftData = fallback;
  } else if (existing.data !== undefined && existing.data !== null && existing.publishedData === undefined) {
    setPatch.data = fallback;
  }
  if (actorUserId) {
    setPatch.updatedByUserId = actorUserId;
    if (!existing.createdByUserId) {
      setPatch.createdByUserId = actorUserId;
    }
  }
  const updated = await Page.findOneAndUpdate(
    query,
    {
      $set: setPatch,
      $inc: { revision: 1 },
    },
    { new: true }
  );
  if (!updated) {
    throw new Error('Page approval request is stale');
  }
  return updated;
}
export async function resetDraftPageData(slug: string) {
  const conn = await connectDB();
  if (!conn) {
    if (smokePages) {
      const existing = getSmokePage(smokePages, slug);
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
        updatedAt: now,
        revision: nextRevision(existing.revision),
        status: 'draft',
        pendingPublishRequest: null
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
  existing.revision = nextRevision(existing.revision);
  existing.status = 'draft';
  existing.pendingPublishRequest = null;
  await existing.save();
  return existing;
}
async function listPagesUncached(options: { includeEmpty?: boolean } = {}): Promise<PageListRecord[]> {
  const conn = await connectDB();
  if (!conn) {
    if (smokePages) {
      const smoke = listSmokePages(smokePages);
      const merged = new Map(
        smoke.map((page) => [
          page.slug,
          {
            ...page,
            ...serializePageOwnership(page)
          }
        ])
      );
      for (const sitePage of SITE_PAGE_DEFS) {
        if (!merged.has(sitePage.slug)) {
          merged.set(sitePage.slug, {
            slug: sitePage.slug,
            title: sitePage.title,
            ...serializePageOwnership()
          });
          continue;
        }
        const current = merged.get(sitePage.slug);
        if (current && !current.title) {
          current.title = sitePage.title;
          merged.set(sitePage.slug, current);
        }
      }
      return Array.from(merged.values()).sort((a, b) => a.slug.localeCompare(b.slug));
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
    .select({
      slug: 1,
      path: 1,
      title: 1,
      updatedAt: 1,
      publishedAt: 1,
      draftUpdatedAt: 1,
      primaryChapterSlug: 1,
      chapterSlugs: 1,
      pendingPublishRequest: 1
    })
    .lean()) as unknown as PageListRecord[];
  const merged = new Map(
    pages.map((page) => [
      page.slug,
      {
        ...page,
        ...serializePageOwnership(page),
        title: page.title || sitePageFallbackTitle(page.slug)
      }
    ])
  );
  for (const sitePage of SITE_PAGE_DEFS) {
    if (!merged.has(sitePage.slug)) {
      merged.set(sitePage.slug, {
        slug: sitePage.slug,
        title: sitePage.title,
        ...serializePageOwnership()
      });
      continue;
    }
    const current = merged.get(sitePage.slug);
    if (current && !current.title) {
      current.title = sitePage.title;
      merged.set(sitePage.slug, current);
    }
  }
  return Array.from(merged.values()).sort((a, b) => a.slug.localeCompare(b.slug));
}
async function listPagesCached(options: { includeEmpty?: boolean } = {}): Promise<PageListRecord[]> {
  'use cache';
  applyCacheLife('minutes');
  cacheTag(pageTags.list(options.includeEmpty));
  return listPagesUncached(options);
}
export async function listPages(options: { includeEmpty?: boolean } = {}): Promise<PageListRecord[]> {
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
