import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/business-reviews/catalog.ts');

import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { ExternalReviewBusiness } from '@/models/ExternalReviewBusiness';
import {
  ExternalReviewBusinessInputSchema,
  type ExternalReviewBusinessData,
  type ExternalReviewBusinessInput
} from '@/lib/business-reviews/shared';

type BusinessDoc = ExternalReviewBusinessInput & {
  _id: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};

function toIso(value?: Date) {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString() : '';
}

function mapBusiness(doc: BusinessDoc): ExternalReviewBusinessData {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    location: doc.location || '',
    category: doc.category || '',
    summary: doc.summary || '',
    websiteUrl: doc.websiteUrl || '',
    published: doc.published === true,
    sortOrder: Number(doc.sortOrder) || 0,
    googlePlaceId: doc.googlePlaceId || '',
    tripadvisorLocationId: doc.tripadvisorLocationId || '',
    tripadvisorUrl: doc.tripadvisorUrl || '',
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt)
  };
}

async function databaseAvailable() {
  return Boolean(await connectDB());
}

export async function listExternalReviewBusinesses(options?: { publishedOnly?: boolean }) {
  if (!(await databaseAvailable())) return [];
  const filter = options?.publishedOnly ? { published: true } : {};
  const docs = (await ExternalReviewBusiness.find(filter)
    .sort({ sortOrder: 1, name: 1 })
    .lean()) as unknown as BusinessDoc[];
  return docs.map(mapBusiness);
}

export async function getPublishedExternalReviewBusiness(slug: string) {
  if (!(await databaseAvailable())) return null;
  const doc = (await ExternalReviewBusiness.findOne({ slug, published: true }).lean()) as unknown as BusinessDoc | null;
  return doc ? mapBusiness(doc) : null;
}

export async function createExternalReviewBusiness(input: unknown, actorUserId: string) {
  if (!(await databaseAvailable())) throw new Error('Database connection unavailable');
  const payload = ExternalReviewBusinessInputSchema.parse(input);
  const existing = await ExternalReviewBusiness.exists({ slug: payload.slug });
  if (existing) throw new Error('That API slug is already in use');
  const doc = await ExternalReviewBusiness.create({
    ...payload,
    createdByUserId: actorUserId,
    updatedByUserId: actorUserId
  });
  return mapBusiness(doc.toObject() as unknown as BusinessDoc);
}

export async function updateExternalReviewBusiness(id: string, input: unknown, actorUserId: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  if (!(await databaseAvailable())) throw new Error('Database connection unavailable');
  const payload = ExternalReviewBusinessInputSchema.parse(input);
  const conflict = await ExternalReviewBusiness.exists({ slug: payload.slug, _id: { $ne: id } });
  if (conflict) throw new Error('That API slug is already in use');
  const doc = (await ExternalReviewBusiness.findByIdAndUpdate(
    id,
    { $set: { ...payload, updatedByUserId: actorUserId } },
    { new: true }
  ).lean()) as unknown as BusinessDoc | null;
  return doc ? mapBusiness(doc) : null;
}

export async function deleteExternalReviewBusiness(id: string) {
  if (!mongoose.isValidObjectId(id)) return false;
  if (!(await databaseAvailable())) throw new Error('Database connection unavailable');
  const result = await ExternalReviewBusiness.deleteOne({ _id: id });
  return result.deletedCount === 1;
}
