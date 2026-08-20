import { assertServerOnly } from '@/lib/_server/guard';
import { sitePageHref } from '@/lib/page-locations';
assertServerOnly('lib/assets/usage.server.ts');

import { connectDB } from '@/lib/db';
import { Page } from '@/models/Page';
import { NewsArticle } from '@/models/NewsArticle';

export type AssetUsageReference = {
  id: string;
  type: 'page' | 'article';
  slug: string;
  title: string;
  status?: string;
  url: string;
  locations: string[];
};

export type AssetUsageItem = {
  key: string;
  count: number;
  references: AssetUsageReference[];
};

type UsageReferenceAccumulator = {
  id: string;
  type: 'page' | 'article';
  slug: string;
  title: string;
  status?: string;
  url: string;
  locations: Set<string>;
};

type UsageAccumulatorByKey = Map<string, Map<string, UsageReferenceAccumulator>>;

type PageUsageRow = {
  slug?: string;
  path?: string;
  title?: string;
  data?: unknown;
  draftData?: unknown;
  publishedData?: unknown;
};

type NewsUsageRow = {
  slug?: string;
  title?: string;
  status?: string;
  img?: string;
  content?: unknown;
  sections?: unknown;
  openGraphImage?: string;
  twitterImage?: string;
  author?: {
    img?: string;
  };
  authorSnapshot?: {
    img?: string;
  };
};

function normalizeAssetKey(value: unknown) {
  if (typeof value !== 'string') return null;
  const key = value.trim().replace(/\\/g, '/');
  if (!key.startsWith('uploads/')) return null;
  return key;
}

function normalizeAssetKeys(values: unknown) {
  const source = Array.isArray(values) ? values : typeof values === 'string' ? values.split(',') : [];
  const unique = new Set<string>();
  for (const value of source) {
    const key = normalizeAssetKey(value);
    if (key) unique.add(key);
  }
  return Array.from(unique.values());
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function buildKeyPatterns(keys: string[]) {
  return keys.map((key) => ({
    key,
    encoded: encodeURIComponent(key),
    filePathEncoded: `/api/assets/file?key=${encodeURIComponent(key)}`,
    filePathRaw: `/api/assets/file?key=${key}`
  }));
}

function findKeysInString(value: string, keyPatterns: ReturnType<typeof buildKeyPatterns>, keySet: Set<string>) {
  const matches = new Set<string>();
  const text = value.trim();
  if (!text) return matches;
  const mayContainAssetReference = text.includes('/api/assets/file') || text.includes('uploads/') || text.includes('%2F');
  if (!mayContainAssetReference) return matches;

  for (const pattern of keyPatterns) {
    if (
      text.includes(pattern.filePathEncoded) ||
      text.includes(pattern.filePathRaw) ||
      text.includes(pattern.key) ||
      text.includes(pattern.encoded)
    ) {
      matches.add(pattern.key);
    }
  }

  if (text.includes('/api/assets/file')) {
    try {
      const parsed = new URL(text, 'http://localhost');
      const rawKey = parsed.searchParams.get('key');
      if (rawKey) {
        const decoded = safeDecodeURIComponent(rawKey.trim());
        if (keySet.has(decoded)) {
          matches.add(decoded);
        }
      }
    } catch {
      // ignore invalid URL values in content blocks
    }
  }

  return matches;
}

function walkValue(
  value: unknown,
  path: string,
  visitString: (value: string, path: string) => void
) {
  if (typeof value === 'string') {
    visitString(value, path);
    return;
  }
  if (!value || typeof value !== 'object') {
    return;
  }
  if (value instanceof Date) {
    return;
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      walkValue(value[index], `${path}[${index}]`, visitString);
    }
    return;
  }
  for (const [nextKey, nextValue] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = path ? `${path}.${nextKey}` : nextKey;
    walkValue(nextValue, nextPath, visitString);
  }
}

function ensureUsageEntry(usageByKey: UsageAccumulatorByKey, key: string) {
  const existing = usageByKey.get(key);
  if (existing) return existing;
  const next = new Map<string, UsageReferenceAccumulator>();
  usageByKey.set(key, next);
  return next;
}

function addMatch(
  usageByKey: UsageAccumulatorByKey,
  key: string,
  reference: {
    id: string;
    type: 'page' | 'article';
    slug: string;
    title: string;
    status?: string;
    url: string;
  },
  location: string
) {
  const refsForKey = ensureUsageEntry(usageByKey, key);
  const existing = refsForKey.get(reference.id);
  if (existing) {
    existing.locations.add(location);
    return;
  }
  refsForKey.set(reference.id, {
    ...reference,
    locations: new Set([location])
  });
}

function scanPages(
  rows: PageUsageRow[],
  keyPatterns: ReturnType<typeof buildKeyPatterns>,
  keySet: Set<string>,
  usageByKey: UsageAccumulatorByKey
) {
  for (const row of rows) {
    const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
    if (!slug) continue;
    const title = typeof row.title === 'string' && row.title.trim() ? row.title.trim() : slug;
    const url = sitePageHref({ slug, path: row.path });

    const sources: Array<{ status: 'draft' | 'published'; root: unknown }> = [];
    if (row.draftData) {
      sources.push({ status: 'draft', root: row.draftData });
    }
    if (row.publishedData) {
      sources.push({ status: 'published', root: row.publishedData });
    } else if (row.data) {
      sources.push({ status: 'published', root: row.data });
    }

    for (const source of sources) {
      const referenceId = `page:${slug}:${source.status}`;
      walkValue(source.root, source.status, (candidate, path) => {
        const matches = findKeysInString(candidate, keyPatterns, keySet);
        if (matches.size === 0) return;
        for (const key of matches) {
          addMatch(
            usageByKey,
            key,
            {
              id: referenceId,
              type: 'page',
              slug,
              title,
              status: source.status,
              url
            },
            path
          );
        }
      });
    }
  }
}

function scanNewsArticles(
  rows: NewsUsageRow[],
  keyPatterns: ReturnType<typeof buildKeyPatterns>,
  keySet: Set<string>,
  usageByKey: UsageAccumulatorByKey
) {
  for (const row of rows) {
    const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
    if (!slug) continue;
    const title = typeof row.title === 'string' && row.title.trim() ? row.title.trim() : slug;
    const status = typeof row.status === 'string' && row.status.trim() ? row.status.trim() : undefined;
    const url = `/news/${slug}`;
    const referenceId = `article:${slug}`;

    const source = {
      img: row.img,
      openGraphImage: row.openGraphImage,
      twitterImage: row.twitterImage,
      author: row.author,
      authorSnapshot: row.authorSnapshot,
      sections: row.sections,
      content: row.content
    };

    walkValue(source, 'article', (candidate, path) => {
      const matches = findKeysInString(candidate, keyPatterns, keySet);
      if (matches.size === 0) return;
      for (const key of matches) {
        addMatch(
          usageByKey,
          key,
          {
            id: referenceId,
            type: 'article',
            slug,
            title,
            status,
            url
          },
          path
        );
      }
    });
  }
}

function toUsageItems(keys: string[], usageByKey: UsageAccumulatorByKey): AssetUsageItem[] {
  return keys.map((key) => {
    const referencesForKey = usageByKey.get(key) ?? new Map<string, UsageReferenceAccumulator>();
    const refs = Array.from(referencesForKey.values())
      .map((ref) => ({
        id: ref.id,
        type: ref.type,
        slug: ref.slug,
        title: ref.title,
        status: ref.status,
        url: ref.url,
        locations: Array.from(ref.locations.values()).sort()
      }))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.slug.localeCompare(b.slug);
      });
    return {
      key,
      count: refs.length,
      references: refs
    };
  });
}

export async function getAssetUsage(keysInput: unknown): Promise<AssetUsageItem[]> {
  const keys = normalizeAssetKeys(keysInput);
  if (keys.length === 0) return [];

  const conn = await connectDB();
  if (!conn) {
    return keys.map((key) => ({ key, count: 0, references: [] }));
  }

  const [pageRows, newsRows] = await Promise.all([
    (Page.find({})
      .select({ slug: 1, path: 1, title: 1, data: 1, draftData: 1, publishedData: 1 })
      .lean()
      .exec()) as unknown as Promise<PageUsageRow[]>,
    (NewsArticle.find({})
      .select({
        slug: 1,
        title: 1,
        status: 1,
        img: 1,
        content: 1,
        sections: 1,
        openGraphImage: 1,
        twitterImage: 1,
        author: 1,
        authorSnapshot: 1
      })
      .lean()
      .exec()) as unknown as Promise<NewsUsageRow[]>
  ]);

  const keySet = new Set(keys);
  const keyPatterns = buildKeyPatterns(keys);
  const usageByKey: UsageAccumulatorByKey = new Map();

  scanPages(pageRows, keyPatterns, keySet, usageByKey);
  scanNewsArticles(newsRows, keyPatterns, keySet, usageByKey);

  return toUsageItems(keys, usageByKey);
}
