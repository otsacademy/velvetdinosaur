import { getChapterName, normalizeChapterSlug, normalizeChapterSlugs } from '@/lib/chapters';

export type PageOwnershipInput = {
  primaryChapterSlug?: unknown;
  chapterSlugs?: unknown;
} | null | undefined;

export type PageOwnershipRecord = {
  primaryChapterSlug: string;
  chapterSlugs: string[];
  primaryChapterName: string | null;
};

export function normalizePageOwnership(input?: PageOwnershipInput) {
  const primaryChapterSlug = normalizeChapterSlug(input?.primaryChapterSlug);
  const chapterSlugs = normalizeChapterSlugs(input?.chapterSlugs, primaryChapterSlug);

  return {
    primaryChapterSlug,
    chapterSlugs
  };
}

export function serializePageOwnership(input?: PageOwnershipInput): PageOwnershipRecord {
  const { primaryChapterSlug, chapterSlugs } = normalizePageOwnership(input);

  return {
    primaryChapterSlug,
    chapterSlugs,
    primaryChapterName: primaryChapterSlug ? getChapterName(primaryChapterSlug) || null : null
  };
}
