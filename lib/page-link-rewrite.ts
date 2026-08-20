import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/page-link-rewrite.ts');

import { connectDB } from '@/lib/db';
import { Page } from '@/models/Page';

// Shared walker over Puck page data for links pointing at a target page.
// Delete removes matching link items; move rewrites their hrefs in place.

export type PageLinkTarget = { slug: string; href: string };

type PageSnapshot = {
  _id: unknown;
  draftData?: unknown;
  publishedData?: unknown;
  data?: unknown;
};

export type CleanupResult = { value: unknown; changed: boolean };

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function matchesTargetHref(value: string, target: PageLinkTarget) {
  const trimmed = value.trim();
  return trimmed === target.href || trimmed === `/${target.slug}` || trimmed === target.slug;
}

export function matchesPageLink(item: unknown, target: PageLinkTarget) {
  if (!isObject(item)) return false;
  const href = typeof item.href === 'string' ? item.href : null;
  const url = typeof item.url === 'string' ? item.url : null;
  const pageSlug = typeof item.pageSlug === 'string' ? item.pageSlug.trim() : null;
  const itemSlug = typeof item.slug === 'string' ? item.slug.trim() : null;

  if (href && matchesTargetHref(href, target)) return true;
  if (url && matchesTargetHref(url, target)) return true;
  if (pageSlug && pageSlug === target.slug) return true;
  if (itemSlug && itemSlug === target.slug) return true;
  return false;
}

// Delete semantics: filter matching link items out of arrays (recursively).
export function removeLinksToPage(value: unknown, target: PageLinkTarget): CleanupResult {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value
      .map((item) => {
        const result = removeLinksToPage(item, target);
        if (result.changed) changed = true;
        return result.value;
      })
      .filter((item) => {
        if (matchesPageLink(item, target)) {
          changed = true;
          return false;
        }
        return true;
      });
    return { value: next, changed };
  }

  if (isObject(value)) {
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      const result = removeLinksToPage(val, target);
      if (result.changed) changed = true;
      next[key] = result.value;
    }
    return { value: next, changed };
  }

  return { value, changed: false };
}

// Move semantics: rewrite matching href/url string values to the new location.
// Identity fields (pageSlug/slug) are untouched — the slug does not change on move.
export function rewriteLinksToPage(
  value: unknown,
  target: PageLinkTarget,
  newHref: string
): CleanupResult {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const result = rewriteLinksToPage(item, target, newHref);
      if (result.changed) changed = true;
      return result.value;
    });
    return { value: next, changed };
  }

  if (isObject(value)) {
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if ((key === 'href' || key === 'url') && typeof val === 'string' && matchesTargetHref(val, target)) {
        next[key] = newHref;
        changed = true;
        continue;
      }
      const result = rewriteLinksToPage(val, target, newHref);
      if (result.changed) changed = true;
      next[key] = result.value;
    }
    return { value: next, changed };
  }

  return { value, changed: false };
}

// Applies a transform to draftData/publishedData/data of every page except
// excludeSlug, persisting only documents that actually changed.
export async function updateInboundLinks(
  excludeSlug: string,
  transform: (data: unknown) => CleanupResult
) {
  const conn = await connectDB();
  if (!conn) return;

  const pages = await Page.find({ slug: { $ne: excludeSlug } })
    .select({ draftData: 1, publishedData: 1, data: 1 })
    .lean<PageSnapshot[]>();

  const updates = pages.map(async (page) => {
    const draft = page.draftData ? transform(page.draftData) : { value: page.draftData, changed: false };
    const published = page.publishedData
      ? transform(page.publishedData)
      : { value: page.publishedData, changed: false };
    const legacy = page.data ? transform(page.data) : { value: page.data, changed: false };

    if (!draft.changed && !published.changed && !legacy.changed) return;

    await Page.updateOne(
      { _id: page._id },
      {
        $set: {
          ...(draft.changed ? { draftData: draft.value } : {}),
          ...(published.changed ? { publishedData: published.value } : {}),
          ...(legacy.changed ? { data: legacy.value } : {})
        }
      }
    );
  });

  await Promise.all(updates);
}
