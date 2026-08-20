import type { Data } from '@puckeditor/core';
import { defaultData } from '@/puck/defaults';

export type PageDoc = {
  slug: string;
  path?: string;
  title?: string;
  data?: unknown;
  draftData?: unknown;
  publishedData?: unknown;
  draftUpdatedAt?: Date;
  publishedAt?: Date;
  primaryChapterSlug?: string | null;
  chapterSlugs?: string[] | null;
  createdByUserId?: string | null;
  updatedByUserId?: string | null;
  pendingPublishRequest?: {
    requestId?: string | null;
    baseRevision?: number | null;
    requestedAt?: Date | null;
    requestedByUserId?: string | null;
    requestedByEmail?: string | null;
    requestedByName?: string | null;
  } | null;
  revision?: number;
  lastRejection?: {
    reason?: string | null;
    rejectedAt?: Date | null;
    rejectedByUserId?: string | null;
    rejectedByEmail?: string | null;
    rejectedByName?: string | null;
  } | null;
  status?: string;
  updatedAt?: Date;
  history?: unknown;
  legacySnapshots?: unknown;
};

export type PageListRecord = Pick<
  PageDoc,
  | 'slug'
  | 'path'
  | 'title'
  | 'draftUpdatedAt'
  | 'publishedAt'
  | 'primaryChapterSlug'
  | 'chapterSlugs'
  | 'pendingPublishRequest'
> & {
  updatedAt?: Date;
  primaryChapterName: string | null;
};

const PAGE_SMOKE_DATE = new Date('1970-01-01T00:00:00Z');

declare global {
  // eslint-disable-next-line no-var
  var vdEditorSmokePages: Map<string, PageDoc> | undefined;
}

export function getPageSmokeStore(enabled: boolean) {
  if (!enabled) return null;
  if (!globalThis.vdEditorSmokePages) {
    globalThis.vdEditorSmokePages = new Map();
  }
  return globalThis.vdEditorSmokePages;
}

export function getSmokePage(store: Map<string, PageDoc> | null, slug: string) {
  return store?.get(slug) ?? null;
}

export function ensureSmokePage(store: Map<string, PageDoc> | null, slug: string) {
  if (!store) return null;
  const existing = store.get(slug);
  if (existing) return existing;
  const seeded: PageDoc = {
    slug,
    draftData: defaultData(slug),
    draftUpdatedAt: PAGE_SMOKE_DATE,
    updatedAt: PAGE_SMOKE_DATE,
    revision: 1,
    pendingPublishRequest: null,
    lastRejection: null,
    status: 'draft',
    primaryChapterSlug: '',
    chapterSlugs: []
  };
  store.set(slug, seeded);
  return seeded;
}

export function listSmokePages(store: Map<string, PageDoc> | null) {
  if (!store) return [];
  return Array.from(store.values()).sort((a, b) => a.slug.localeCompare(b.slug));
}

export function normalizeRevision(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
}

export function nextRevision(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
    return Math.floor(value) + 1;
  }
  return 1;
}

export function resolvePublishedData(page: PageDoc | null): unknown | null {
  if (!page) return null;
  return page.publishedData ?? page.data ?? null;
}

export function resolveDraftData(page: PageDoc | null): unknown | null {
  if (!page) return null;
  return page.draftData ?? page.publishedData ?? page.data ?? null;
}

export function isPuckData(value: unknown): value is Data {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as { root?: unknown; content?: unknown };
  if (!maybe.root || typeof maybe.root !== 'object') return false;
  if (!Array.isArray(maybe.content)) return false;
  return true;
}
