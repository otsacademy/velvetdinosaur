import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/content/reviews.ts');

import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { Review } from '@/models/Review';
import { slugify } from '@/lib/content/slug';
import { cacheLife } from 'next/cache';
import type { Review as ReviewType } from './types';

const reviewSchema = z.object({
  slug: z.string().min(1),
  author: z.string().min(1),
  role: z.string().optional(),
  dateLabel: z.string().optional(),
  content: z.string().min(1),
  avatar: z.string().optional(),
  source: z.enum(['linkedin', 'testimonial', 'note', 'phone', 'google']).optional(),
  highlight: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional()
});

export type ReviewInput = z.infer<typeof reviewSchema>;

type ReviewDoc = {
  slug?: string;
  author?: string;
  role?: string;
  dateLabel?: string;
  content?: string;
  avatar?: string;
  source?: ReviewType['source'];
  rating?: number;
  highlight?: boolean;
  toObject?: () => ReviewDoc;
};

function map(doc: ReviewDoc): ReviewType {
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    slug: String(plain.slug || ''),
    author: String(plain.author || ''),
    role: plain.role,
    dateLabel: plain.dateLabel,
    content: String(plain.content || ''),
    avatar: plain.avatar,
    source: plain.source,
    rating: plain.rating,
    highlight: plain.highlight
  };
}

async function listReviewsUncached(): Promise<ReviewType[]> {
  const conn = await connectDB();
  if (!conn) return [];
  const docs = (await Review.find({}).sort({ highlight: -1, createdAt: -1 }).lean()) as ReviewDoc[];
  return docs.map(map);
}

async function listReviewsCached(): Promise<ReviewType[]> {
  'use cache';
  cacheLife('minutes');
  return listReviewsUncached();
}

export async function listReviews(): Promise<ReviewType[]> {
  return listReviewsCached();
}

async function getReviewUncached(slug: string): Promise<ReviewType | null> {
  const conn = await connectDB();
  if (!conn) return null;
  const doc = (await Review.findOne({ slug }).lean()) as ReviewDoc | null;
  return doc ? map(doc) : null;
}

async function getReviewCached(slug: string): Promise<ReviewType | null> {
  'use cache';
  cacheLife('minutes');
  return getReviewUncached(slug);
}

export async function getReview(slug: string): Promise<ReviewType | null> {
  return getReviewCached(slug);
}

export async function upsertReview(input: Omit<ReviewInput, 'slug'> & { slug?: string }) {
  const inferredSlug = input.slug || slugify(`${input.author}-${input.dateLabel || ''}`.trim());
  const payload = reviewSchema.parse({ ...input, slug: inferredSlug });
  await connectDB();
  const doc = await Review.findOneAndUpdate({ slug: payload.slug }, payload, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true
  });
  return map(doc);
}

export async function upsertReviews(inputs: Array<Omit<ReviewInput, 'slug'> & { slug?: string }>) {
  const results: ReviewType[] = [];
  for (const entry of inputs) {
    results.push(await upsertReview(entry));
  }
  return results;
}

