import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/booking/catalog.ts');

import { connectDB } from '@/lib/db';
import { BookingService } from '@/models/BookingService';
import { BookingResource } from '@/models/BookingResource';
import {
  clean,
  isValidDateStr,
  isValidTimeRange,
  slugify,
  type AvailabilityException,
  type BookingResourceData,
  type BookingServiceData,
  type WeeklyHoursEntry
} from '@/lib/booking/shared';

type ServiceDoc = {
  _id: unknown;
  name: string;
  slug: string;
  description?: string;
  durationMinutes: number;
  bufferMinutes?: number;
  pricePence?: number | null;
  active: boolean;
  sortOrder?: number;
};

type ResourceDoc = {
  _id: unknown;
  name: string;
  email?: string;
  serviceIds?: string[];
  weeklyHours?: WeeklyHoursEntry[];
  exceptions?: AvailabilityException[];
  active: boolean;
  sortOrder?: number;
};

export function toServiceData(doc: ServiceDoc): BookingServiceData {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? '',
    durationMinutes: doc.durationMinutes,
    bufferMinutes: doc.bufferMinutes ?? 0,
    pricePence: doc.pricePence ?? null,
    active: doc.active,
    sortOrder: doc.sortOrder ?? 0
  };
}

export function toResourceData(doc: ResourceDoc): BookingResourceData {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email ?? '',
    serviceIds: Array.isArray(doc.serviceIds) ? doc.serviceIds.map(String) : [],
    weeklyHours: Array.isArray(doc.weeklyHours) ? doc.weeklyHours : [],
    exceptions: Array.isArray(doc.exceptions) ? doc.exceptions : [],
    active: doc.active,
    sortOrder: doc.sortOrder ?? 0
  };
}

export type ServiceInput = {
  name: string;
  description?: string;
  durationMinutes: number;
  bufferMinutes?: number;
  pricePence?: number | null;
  active?: boolean;
  sortOrder?: number;
};

function normalizeServiceInput(input: ServiceInput) {
  const name = clean(input.name);
  const durationMinutes = Math.round(Number(input.durationMinutes));
  const bufferMinutes = Math.round(Number(input.bufferMinutes ?? 0));
  const pricePence =
    input.pricePence === null || input.pricePence === undefined
      ? null
      : Math.max(0, Math.round(Number(input.pricePence)));
  if (!name) throw new Error('Service name is required');
  if (!Number.isFinite(durationMinutes) || durationMinutes < 5 || durationMinutes > 1440) {
    throw new Error('Duration must be between 5 minutes and 24 hours');
  }
  return {
    name,
    description: clean(input.description),
    durationMinutes,
    bufferMinutes: Number.isFinite(bufferMinutes) ? Math.min(240, Math.max(0, bufferMinutes)) : 0,
    pricePence: pricePence !== null && Number.isFinite(pricePence) ? pricePence : null,
    active: input.active !== false,
    sortOrder: Math.round(Number(input.sortOrder ?? 0)) || 0
  };
}

export async function listServices(options?: { activeOnly?: boolean }) {
  await connectDB();
  const filter = options?.activeOnly ? { active: true } : {};
  const docs = (await BookingService.find(filter).sort({ sortOrder: 1, name: 1 }).lean()) as unknown as ServiceDoc[];
  return docs.map(toServiceData);
}

export async function getServiceBySlug(slug: string) {
  await connectDB();
  const doc = (await BookingService.findOne({ slug: slugify(slug) }).lean()) as unknown as ServiceDoc | null;
  return doc ? toServiceData(doc) : null;
}

export async function getServiceById(id: string) {
  await connectDB();
  const doc = (await BookingService.findById(id).lean()) as unknown as ServiceDoc | null;
  return doc ? toServiceData(doc) : null;
}

export async function createService(input: ServiceInput) {
  await connectDB();
  const normalized = normalizeServiceInput(input);
  const baseSlug = slugify(normalized.name) || 'service';
  let slug = baseSlug;
  for (let attempt = 1; await BookingService.exists({ slug }); attempt += 1) {
    slug = `${baseSlug}-${attempt + 1}`;
  }
  const doc = await BookingService.create({ ...normalized, slug });
  return toServiceData(doc.toObject() as ServiceDoc);
}

export async function updateService(id: string, input: ServiceInput) {
  await connectDB();
  const normalized = normalizeServiceInput(input);
  const doc = await BookingService.findByIdAndUpdate(id, { $set: normalized }, { new: true }).lean();
  return doc ? toServiceData(doc as unknown as ServiceDoc) : null;
}

export type ResourceInput = {
  name: string;
  email?: string;
  serviceIds?: string[];
  weeklyHours?: WeeklyHoursEntry[];
  exceptions?: AvailabilityException[];
  active?: boolean;
  sortOrder?: number;
};

function normalizeResourceInput(input: ResourceInput) {
  const name = clean(input.name);
  if (!name) throw new Error('Resource name is required');
  const weeklyHours = (Array.isArray(input.weeklyHours) ? input.weeklyHours : [])
    .map((entry) => ({
      day: Math.round(Number(entry?.day)),
      ranges: (Array.isArray(entry?.ranges) ? entry.ranges : [])
        .map((range) => ({ start: clean(range?.start), end: clean(range?.end) }))
        .filter(isValidTimeRange)
    }))
    .filter((entry) => Number.isInteger(entry.day) && entry.day >= 0 && entry.day <= 6);
  const exceptions = (Array.isArray(input.exceptions) ? input.exceptions : [])
    .map((entry) => ({
      date: clean(entry?.date),
      available: entry?.available === true,
      ranges: (Array.isArray(entry?.ranges) ? entry.ranges : [])
        .map((range) => ({ start: clean(range?.start), end: clean(range?.end) }))
        .filter(isValidTimeRange)
    }))
    .filter((entry) => isValidDateStr(entry.date));
  return {
    name,
    email: clean(input.email).toLowerCase(),
    serviceIds: (Array.isArray(input.serviceIds) ? input.serviceIds : []).map(clean).filter(Boolean),
    weeklyHours,
    exceptions,
    active: input.active !== false,
    sortOrder: Math.round(Number(input.sortOrder ?? 0)) || 0
  };
}

export async function listResources(options?: { activeOnly?: boolean }) {
  await connectDB();
  const filter = options?.activeOnly ? { active: true } : {};
  const docs = (await BookingResource.find(filter).sort({ sortOrder: 1, name: 1 }).lean()) as unknown as ResourceDoc[];
  return docs.map(toResourceData);
}

export async function getResourceById(id: string) {
  await connectDB();
  if (!id) return null;
  const doc = (await BookingResource.findById(id).lean()) as unknown as ResourceDoc | null;
  return doc ? toResourceData(doc) : null;
}

export async function createResource(input: ResourceInput) {
  await connectDB();
  const doc = await BookingResource.create(normalizeResourceInput(input));
  return toResourceData(doc.toObject() as ResourceDoc);
}

export async function updateResource(id: string, input: ResourceInput) {
  await connectDB();
  const doc = await BookingResource.findByIdAndUpdate(
    id,
    { $set: normalizeResourceInput(input) },
    { new: true }
  ).lean();
  return doc ? toResourceData(doc as unknown as ResourceDoc) : null;
}

/** Resources that offer a given service (empty serviceIds = offers all). */
export function resourceOffersService(resource: BookingResourceData, serviceId: string) {
  return resource.serviceIds.length === 0 || resource.serviceIds.includes(serviceId);
}
