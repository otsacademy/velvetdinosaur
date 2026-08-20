import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/support/content.ts');

import { connectDB } from '@/lib/db';
import { SupportArticle, supportArticleTypes } from '@/models/SupportArticle';
import { SupportDoc, supportDocLinkTypes } from '@/models/SupportDoc';

export type SupportDocLinkType = (typeof supportDocLinkTypes)[number];
export type SupportArticleType = (typeof supportArticleTypes)[number];

export type SupportDocSummary = {
  id: string;
  title: string;
  description: string;
  module: string;
  category: string;
  tags: string[];
  linkType: SupportDocLinkType;
  url: string;
  searchable: boolean;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SupportArticleSummary = {
  id: string;
  title: string;
  slug: string;
  type: SupportArticleType;
  category: string;
  module: string;
  tags: string[];
  summary: string;
  bodyText: string;
  searchable: boolean;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type DocDoc = {
  _id?: unknown;
  title?: unknown;
  description?: unknown;
  module?: unknown;
  category?: unknown;
  tags?: unknown;
  linkType?: unknown;
  url?: unknown;
  searchable?: unknown;
  publishedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type ArticleDoc = {
  _id?: unknown;
  title?: unknown;
  slug?: unknown;
  type?: unknown;
  category?: unknown;
  module?: unknown;
  tags?: unknown;
  summary?: unknown;
  bodyText?: unknown;
  searchable?: unknown;
  publishedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toDateIsoOrNull(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toIdString(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && value && 'toString' in value) {
    const toString = (value as { toString?: () => string }).toString;
    if (typeof toString === 'function') return toString.call(value);
  }
  return '';
}

function normalizeTags(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  const unique = new Set<string>();
  for (const value of raw) {
    const next = clean(value).toLowerCase();
    if (next) unique.add(next);
  }
  return Array.from(unique);
}

function regexSafe(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeDocLinkType(value: unknown): SupportDocLinkType {
  const candidate = clean(value) as SupportDocLinkType;
  return supportDocLinkTypes.includes(candidate) ? candidate : 'view';
}

function normalizeArticleType(value: unknown): SupportArticleType {
  const candidate = clean(value) as SupportArticleType;
  return supportArticleTypes.includes(candidate) ? candidate : 'knowledge';
}

function mapDoc(doc: DocDoc): SupportDocSummary {
  return {
    id: toIdString(doc._id),
    title: clean(doc.title),
    description: clean(doc.description),
    module: clean(doc.module),
    category: clean(doc.category),
    tags: normalizeTags(doc.tags),
    linkType: normalizeDocLinkType(doc.linkType),
    url: clean(doc.url),
    searchable: Boolean(doc.searchable),
    publishedAt: toDateIsoOrNull(doc.publishedAt),
    createdAt: toDateIsoOrNull(doc.createdAt),
    updatedAt: toDateIsoOrNull(doc.updatedAt)
  };
}

function mapArticle(doc: ArticleDoc): SupportArticleSummary {
  return {
    id: toIdString(doc._id),
    title: clean(doc.title),
    slug: clean(doc.slug),
    type: normalizeArticleType(doc.type),
    category: clean(doc.category),
    module: clean(doc.module),
    tags: normalizeTags(doc.tags),
    summary: clean(doc.summary),
    bodyText: clean(doc.bodyText),
    searchable: Boolean(doc.searchable),
    publishedAt: toDateIsoOrNull(doc.publishedAt),
    createdAt: toDateIsoOrNull(doc.createdAt),
    updatedAt: toDateIsoOrNull(doc.updatedAt)
  };
}

export async function listSupportDocs(options?: {
  q?: string | null;
  module?: string | null;
  category?: string | null;
  limit?: number;
}) {
  await connectDB();
  const q = clean(options?.q);
  const moduleFilter = clean(options?.module);
  const category = clean(options?.category);
  const limit = Math.max(1, Math.min(500, Math.round(Number(options?.limit || 120))));

  const query: Record<string, unknown> = { isActive: true };
  if (moduleFilter) query.module = moduleFilter;
  if (category) query.category = category;
  if (q) {
    const safe = regexSafe(q);
    query.$or = [
      { title: { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
      { module: { $regex: safe, $options: 'i' } },
      { category: { $regex: safe, $options: 'i' } },
      { tags: { $regex: safe, $options: 'i' } }
    ];
  }

  const rows = (await SupportDoc.find(query)
    .sort({ publishedAt: -1, createdAt: -1, _id: -1 })
    .limit(limit)
    .lean()) as DocDoc[];
  return rows.map(mapDoc);
}

export async function createSupportDoc(input: {
  title: string;
  description?: string;
  module?: string;
  category?: string;
  tags?: string[];
  linkType?: SupportDocLinkType;
  url: string;
  searchable?: boolean;
  createdByUserId?: string;
  createdByEmail?: string;
  publishedAt?: string | null;
}) {
  await connectDB();
  const publishedAt = input.publishedAt ? new Date(input.publishedAt) : new Date();

  const created = await SupportDoc.create({
    title: clean(input.title),
    description: clean(input.description),
    module: clean(input.module),
    category: clean(input.category),
    tags: normalizeTags(input.tags),
    linkType: normalizeDocLinkType(input.linkType),
    url: clean(input.url),
    searchable: input.searchable !== false,
    createdByUserId: clean(input.createdByUserId),
    createdByEmail: clean(input.createdByEmail).toLowerCase(),
    publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt
  });

  return mapDoc(created.toObject() as DocDoc);
}

function slugify(input: string) {
  return clean(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function uniqueArticleSlug(base: string) {
  const seed = slugify(base) || `support-article-${Date.now()}`;
  for (let counter = 0; counter < 200; counter += 1) {
    const candidate = counter === 0 ? seed : `${seed}-${counter + 1}`;
    const exists = await SupportArticle.exists({ slug: candidate });
    if (!exists) return candidate;
  }
  return `${seed}-${Date.now()}`;
}

export async function listSupportArticles(options?: {
  type?: SupportArticleType | 'all';
  q?: string | null;
  module?: string | null;
  category?: string | null;
  limit?: number;
}) {
  await connectDB();
  const type = (clean(options?.type) || 'all') as SupportArticleType | 'all';
  const q = clean(options?.q);
  const moduleFilter = clean(options?.module);
  const category = clean(options?.category);
  const limit = Math.max(1, Math.min(500, Math.round(Number(options?.limit || 120))));

  const query: Record<string, unknown> = { isActive: true };
  if (type !== 'all') query.type = normalizeArticleType(type);
  if (moduleFilter) query.module = moduleFilter;
  if (category) query.category = category;
  if (q) {
    const safe = regexSafe(q);
    query.$or = [
      { title: { $regex: safe, $options: 'i' } },
      { summary: { $regex: safe, $options: 'i' } },
      { bodyText: { $regex: safe, $options: 'i' } },
      { module: { $regex: safe, $options: 'i' } },
      { category: { $regex: safe, $options: 'i' } },
      { tags: { $regex: safe, $options: 'i' } }
    ];
  }

  const rows = (await SupportArticle.find(query)
    .sort({ publishedAt: -1, createdAt: -1, _id: -1 })
    .limit(limit)
    .lean()) as ArticleDoc[];
  return rows.map(mapArticle);
}

export async function createSupportArticle(input: {
  title: string;
  slug?: string;
  type: SupportArticleType;
  category?: string;
  module?: string;
  tags?: string[];
  summary?: string;
  bodyText?: string;
  searchable?: boolean;
  createdByUserId?: string;
  createdByEmail?: string;
  publishedAt?: string | null;
}) {
  await connectDB();
  const publishedAt = input.publishedAt ? new Date(input.publishedAt) : new Date();
  const normalizedSlug = clean(input.slug) ? slugify(input.slug || '') : await uniqueArticleSlug(input.title);

  const created = await SupportArticle.create({
    title: clean(input.title),
    slug: normalizedSlug,
    type: normalizeArticleType(input.type),
    category: clean(input.category),
    module: clean(input.module),
    tags: normalizeTags(input.tags),
    summary: clean(input.summary),
    bodyText: clean(input.bodyText),
    searchable: input.searchable !== false,
    createdByUserId: clean(input.createdByUserId),
    createdByEmail: clean(input.createdByEmail).toLowerCase(),
    publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt
  });

  return mapArticle(created.toObject() as ArticleDoc);
}
