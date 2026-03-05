import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/content/advocates.ts');

import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { Advocate } from '@/models/Advocate';
import { cacheLife } from 'next/cache';
import type { Advocate as AdvocateType, CTA } from './types';

const advocateSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  location: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  category: z.enum(['cultural', 'nature', 'wellbeing', 'tour', 'stays', 'charity']).optional(),
  cta: z
    .object({
      label: z.string(),
      href: z.string(),
      target: z.enum(['_self', '_blank']).optional(),
      rel: z.string().optional(),
      variant: z.enum(['primary', 'secondary', 'ghost', 'link']).optional()
    })
    .optional(),
  tags: z.array(z.string()).optional()
});

export type AdvocateInput = z.infer<typeof advocateSchema>;

type AdvocateDoc = {
  slug?: string;
  name?: string;
  location?: string;
  description?: string;
  website?: string;
  category?: AdvocateType['category'];
  cta?: CTA;
  tags?: string[];
  toObject?: () => AdvocateDoc;
};

function map(doc: AdvocateDoc): AdvocateType {
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    slug: String(plain.slug || ''),
    name: String(plain.name || ''),
    location: plain.location,
    description: plain.description,
    website: plain.website,
    category: plain.category,
    cta: plain.cta as CTA | undefined,
    tags: plain.tags || []
  };
}

async function listAdvocatesUncached(): Promise<AdvocateType[]> {
  const conn = await connectDB();
  if (!conn) return [];
  const docs = (await Advocate.find({}).sort({ name: 1 }).lean()) as AdvocateDoc[];
  return docs.map(map);
}

async function listAdvocatesCached(): Promise<AdvocateType[]> {
  'use cache';
  cacheLife('minutes');
  return listAdvocatesUncached();
}

export async function listAdvocates(): Promise<AdvocateType[]> {
  return listAdvocatesCached();
}

async function getAdvocateUncached(slug: string): Promise<AdvocateType | null> {
  const conn = await connectDB();
  if (!conn) return null;
  const doc = (await Advocate.findOne({ slug }).lean()) as AdvocateDoc | null;
  return doc ? map(doc) : null;
}

async function getAdvocateCached(slug: string): Promise<AdvocateType | null> {
  'use cache';
  cacheLife('minutes');
  return getAdvocateUncached(slug);
}

export async function getAdvocate(slug: string): Promise<AdvocateType | null> {
  return getAdvocateCached(slug);
}

export async function upsertAdvocate(input: AdvocateInput) {
  const payload = advocateSchema.parse(input);
  await connectDB();
  const doc = await Advocate.findOneAndUpdate({ slug: payload.slug }, payload, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true
  });
  return map(doc);
}

export async function upsertAdvocates(inputs: AdvocateInput[]) {
  const results: AdvocateType[] = [];
  for (const entry of inputs) {
    results.push(await upsertAdvocate(entry));
  }
  return results;
}

