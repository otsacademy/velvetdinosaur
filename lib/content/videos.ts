import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/content/videos.ts');

import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { Video } from '@/models/Video';
import { cacheLife } from 'next/cache';
import type { VideoAsset } from './types';

const videoSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  platform: z.enum(['youtube', 'tiktok', 'vimeo', 'direct']).optional(),
  videoId: z.string().optional(),
  url: z.string().optional(),
  thumbnail: z.string().optional(),
  category: z.enum(['about', 'short', 'showcase']).optional(),
  author: z.string().optional(),
  likes: z.coerce.number().optional(),
  shares: z.coerce.number().optional()
});

export type VideoInput = z.infer<typeof videoSchema>;

type VideoDoc = {
  slug?: string;
  title?: string;
  description?: string;
  platform?: VideoAsset['platform'];
  videoId?: string;
  url?: string;
  thumbnail?: string;
  category?: VideoAsset['category'];
  author?: string;
  likes?: number;
  shares?: number;
  toObject?: () => VideoDoc;
};

function map(doc: VideoDoc): VideoAsset {
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    slug: String(plain.slug || ''),
    title: String(plain.title || ''),
    description: plain.description,
    platform: plain.platform,
    videoId: plain.videoId,
    url: plain.url,
    thumbnail: plain.thumbnail,
    category: plain.category,
    author: plain.author,
    likes: plain.likes,
    shares: plain.shares
  };
}

async function listVideosUncached(category?: VideoAsset['category']): Promise<VideoAsset[]> {
  const conn = await connectDB();
  if (!conn) return [];
  const query = category ? { category } : {};
  const docs = (await Video.find(query).sort({ createdAt: -1 }).lean()) as VideoDoc[];
  return docs.map(map);
}

async function listVideosCached(category?: VideoAsset['category']): Promise<VideoAsset[]> {
  'use cache';
  cacheLife('minutes');
  return listVideosUncached(category);
}

export async function listVideos(category?: VideoAsset['category']): Promise<VideoAsset[]> {
  return listVideosCached(category);
}

async function getVideoUncached(slug: string): Promise<VideoAsset | null> {
  const conn = await connectDB();
  if (!conn) return null;
  const doc = (await Video.findOne({ slug }).lean()) as VideoDoc | null;
  return doc ? map(doc) : null;
}

async function getVideoCached(slug: string): Promise<VideoAsset | null> {
  'use cache';
  cacheLife('minutes');
  return getVideoUncached(slug);
}

export async function getVideo(slug: string): Promise<VideoAsset | null> {
  return getVideoCached(slug);
}

export async function upsertVideo(input: VideoInput) {
  const payload = videoSchema.parse(input);
  await connectDB();
  const doc = await Video.findOneAndUpdate({ slug: payload.slug }, payload, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true
  });
  return map(doc);
}

export async function upsertVideos(inputs: VideoInput[]) {
  const results: VideoAsset[] = [];
  for (const entry of inputs) {
    results.push(await upsertVideo(entry));
  }
  return results;
}
