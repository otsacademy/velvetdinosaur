import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/content/stays.ts');

import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { Stay } from '@/models/Stay';
import { cacheLife } from 'next/cache';
import type { CTA, Stay as StayType } from './types';

const ctaSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  target: z.enum(['_self', '_blank']).optional(),
  rel: z.string().optional(),
  variant: z.enum(['primary', 'secondary', 'ghost', 'link']).optional()
});

const staySchema = z.object({
  slug: z.string().min(1),
  sortOrder: z.coerce.number().optional(),
  name: z.string().min(1),
  location: z.string().optional(),
  type: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  heroImage: z.string().url().optional(),
  gallery: z.array(z.string().url()).optional(),
  videoId: z.string().optional(),
  price: z.coerce.number().optional(),
  currency: z.string().optional(),
  isStartingFrom: z.boolean().optional(),
  badges: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  policies: z.array(z.string()).optional(),
  ctas: z.array(ctaSchema).optional(),
  details: z
    .object({
      guests: z.coerce.number().optional(),
      bedrooms: z.coerce.number().optional(),
      bathrooms: z.coerce.number().optional(),
      size: z.string().optional(),
      externalId: z.coerce.number().optional()
    })
    .optional(),
  address: z
    .object({
      address: z.string().optional(),
      city: z.string().optional(),
      area: z.string().optional(),
      county: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zip: z.string().optional()
    })
    .optional(),
  metaNote: z.string().optional()
});

export type StayInput = z.infer<typeof staySchema>;

type StayDoc = {
  slug?: string;
  sortOrder?: number;
  name?: string;
  location?: string;
  type?: string;
  summary?: string;
  description?: string;
  heroImage?: string;
  gallery?: string[];
  videoId?: string;
  price?: number;
  currency?: string;
  isStartingFrom?: boolean;
  badges?: string[];
  amenities?: string[];
  policies?: string[];
  ctas?: CTA[];
  details?: StayType['details'];
  address?: StayType['address'];
  metaNote?: string;
  toObject?: () => StayDoc;
};

function map(doc: StayDoc): StayType {
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    slug: String(plain.slug || ''),
    sortOrder: plain.sortOrder,
    name: String(plain.name || ''),
    location: plain.location,
    type: plain.type,
    summary: plain.summary,
    description: plain.description,
    heroImage: plain.heroImage,
    gallery: plain.gallery || [],
    videoId: plain.videoId,
    price: plain.price,
    currency: plain.currency,
    isStartingFrom: plain.isStartingFrom,
    badges: plain.badges || [],
    amenities: plain.amenities || [],
    policies: plain.policies || [],
    ctas: plain.ctas || [],
    details: plain.details,
    address: plain.address,
    metaNote: plain.metaNote
  };
}

async function listStaysUncached(): Promise<StayType[]> {
  const conn = await connectDB();
  if (!conn) return [];
  const docs = (await Stay.find({}).sort({ sortOrder: 1, name: 1 }).lean()) as StayDoc[];
  return docs.map(map);
}

async function listStaysCached(): Promise<StayType[]> {
  'use cache';
  cacheLife('minutes');
  return listStaysUncached();
}

export async function listStays(): Promise<StayType[]> {
  return listStaysCached();
}

async function getStayBySlugUncached(slug: string): Promise<StayType | null> {
  const conn = await connectDB();
  if (!conn) return null;
  const doc = (await Stay.findOne({ slug }).lean()) as StayDoc | null;
  return doc ? map(doc) : null;
}

async function getStayBySlugCached(slug: string): Promise<StayType | null> {
  'use cache';
  cacheLife('minutes');
  return getStayBySlugUncached(slug);
}

export async function getStayBySlug(slug: string): Promise<StayType | null> {
  return getStayBySlugCached(slug);
}

export async function getLatestStays(
  limitOrOptions: number | { limit?: number; excludeSlug?: string } = 6
) {
  const limit =
    typeof limitOrOptions === 'number'
      ? limitOrOptions
      : (limitOrOptions.limit ?? 6);
  const excludeSlug =
    typeof limitOrOptions === 'number'
      ? undefined
      : limitOrOptions.excludeSlug;

  const conn = await connectDB();
  if (!conn) return [];
  const query = excludeSlug ? { slug: { $ne: excludeSlug } } : {};
  const docs = (await Stay.find(query).sort({ createdAt: -1 }).limit(limit).lean()) as StayDoc[];
  return docs.map(map);
}

export async function getSimilarStays(
  slugOrOptions: string | { staySlug?: string; slug?: string; limit?: number },
  limitFallback = 3
) {
  const slug =
    typeof slugOrOptions === 'string'
      ? slugOrOptions
      : (slugOrOptions.staySlug ?? slugOrOptions.slug ?? '');
  const limit =
    typeof slugOrOptions === 'string'
      ? limitFallback
      : (slugOrOptions.limit ?? limitFallback);

  if (!slug) return [];
  const conn = await connectDB();
  if (!conn) return [];
  const docs = (await Stay.find({ slug: { $ne: slug } }).limit(limit).lean()) as StayDoc[];
  return docs.map(map);
}

export async function upsertStay(input: StayInput) {
  const payload = staySchema.parse(input);
  await connectDB();
  const doc = await Stay.findOneAndUpdate({ slug: payload.slug }, payload, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true
  });
  return map(doc);
}

export async function upsertStays(inputs: StayInput[]) {
  const results: StayType[] = [];
  for (const entry of inputs) {
    results.push(await upsertStay(entry));
  }
  return results;
}
