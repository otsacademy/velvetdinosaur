import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/booking/bookings.ts');

import { connectDB } from '@/lib/db';
import { ACTIVE_BOOKING_STATUSES, Booking } from '@/models/Booking';
import { getBookingSettings } from '@/lib/booking/settings';
import { computeSlots, type BookingSlot } from '@/lib/booking/slots';
import { dateStrInZone } from '@/lib/booking/timezone';
import { generateManageToken, hashManageToken } from '@/lib/booking/token';
import { getResourceById, getServiceById, resourceOffersService } from '@/lib/booking/catalog';
import type {
  BookingData,
  BookingResourceData,
  BookingServiceData,
  BookingSettingsData,
  BookingStatus
} from '@/lib/booking/shared';

type BookingDoc = {
  _id: unknown;
  serviceId: string;
  serviceName: string;
  resourceId?: string;
  resourceName?: string;
  customer: { name: string; email: string; phone?: string };
  startAt: Date;
  endAt: Date;
  status: BookingStatus;
  source: 'public' | 'admin';
  notes?: string;
};

export function toBookingData(doc: BookingDoc): BookingData {
  return {
    id: String(doc._id),
    serviceId: doc.serviceId,
    serviceName: doc.serviceName,
    resourceId: doc.resourceId ?? '',
    resourceName: doc.resourceName ?? '',
    customer: {
      name: doc.customer.name,
      email: doc.customer.email,
      phone: doc.customer.phone ?? ''
    },
    startAt: doc.startAt.toISOString(),
    endAt: doc.endAt.toISOString(),
    status: doc.status,
    source: doc.source,
    notes: doc.notes ?? ''
  };
}

/** Resource hours when it defines its own, otherwise the venue-level hours. */
export function resolveAvailability(resource: BookingResourceData | null, settings: BookingSettingsData) {
  const hasOwnHours = resource !== null && (resource.weeklyHours.length > 0 || resource.exceptions.length > 0);
  return {
    weeklyHours: hasOwnHours ? resource.weeklyHours : settings.weeklyHours,
    exceptions: hasOwnHours ? resource.exceptions : settings.exceptions
  };
}

async function listExistingForWindow(resourceId: string, fromUtc: Date, toUtc: Date) {
  const docs = (await Booking.find({
    resourceId,
    status: { $in: [...ACTIVE_BOOKING_STATUSES] },
    startAt: { $lt: toUtc },
    endAt: { $gt: fromUtc }
  })
    .select({ startAt: 1, endAt: 1 })
    .lean()) as unknown as { startAt: Date; endAt: Date }[];
  return docs;
}

export async function getAvailabilityForDate(input: {
  service: BookingServiceData;
  resourceId?: string;
  date: string;
  now?: Date;
}): Promise<BookingSlot[]> {
  await connectDB();
  const settings = await getBookingSettings();
  const resource = input.resourceId ? await getResourceById(input.resourceId) : null;
  if (input.resourceId && (!resource || !resource.active || !resourceOffersService(resource, input.service.id))) {
    return [];
  }
  const availability = resolveAvailability(resource, settings);
  const dayStart = new Date(`${input.date}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart.getTime() + 2 * 86_400_000); // generous cover for tz edges
  const existing = await listExistingForWindow(resource?.id ?? '', new Date(dayStart.getTime() - 86_400_000), dayEnd);
  return computeSlots({
    date: input.date,
    durationMinutes: input.service.durationMinutes,
    bufferMinutes: input.service.bufferMinutes,
    weeklyHours: availability.weeklyHours,
    exceptions: availability.exceptions,
    existing,
    timezone: settings.timezone,
    slotGranularityMinutes: settings.slotGranularityMinutes,
    minLeadTimeHours: settings.minLeadTimeHours,
    maxAdvanceDays: settings.maxAdvanceDays,
    now: input.now ?? new Date()
  });
}

export class BookingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function createBooking(input: {
  serviceId: string;
  resourceId?: string;
  startAt: Date;
  customer: { name: string; email: string; phone?: string };
  notes?: string;
  source: 'public' | 'admin';
}): Promise<{ booking: BookingData; manageToken: string }> {
  await connectDB();
  const service = await getServiceById(input.serviceId);
  if (!service || !service.active) throw new BookingError('Unknown or inactive service', 404);

  const settings = await getBookingSettings();
  const resource = input.resourceId ? await getResourceById(input.resourceId) : null;
  if (input.resourceId && (!resource || !resource.active)) throw new BookingError('Unknown or inactive resource', 404);
  if (resource && !resourceOffersService(resource, service.id)) {
    throw new BookingError('This resource does not offer that service', 409);
  }

  const date = dateStrInZone(input.startAt, settings.timezone);
  const slots = await getAvailabilityForDate({ service, resourceId: resource?.id, date });
  const slot = slots.find((candidate) => candidate.startAt.getTime() === input.startAt.getTime());
  if (!slot) throw new BookingError('That time is no longer available', 409);

  const token = generateManageToken(settings.manageTokenTtlDays);
  const doc = await Booking.create({
    serviceId: service.id,
    serviceName: service.name,
    resourceId: resource?.id ?? '',
    resourceName: resource?.name ?? '',
    customer: {
      name: input.customer.name.trim(),
      email: input.customer.email.trim().toLowerCase(),
      phone: (input.customer.phone ?? '').trim()
    },
    startAt: slot.startAt,
    endAt: slot.endAt,
    status: settings.autoConfirm || input.source === 'admin' ? 'confirmed' : 'requested',
    manageTokenHash: token.hash,
    manageTokenExpiresAt: token.expiresAt,
    source: input.source,
    notes: (input.notes ?? '').trim()
  });
  return { booking: toBookingData(doc.toObject() as BookingDoc), manageToken: token.raw };
}

type TokenBookingDoc = BookingDoc & {
  manageTokenHash?: string;
  manageTokenExpiresAt?: Date | null;
};

async function findBookingByToken(rawToken: string) {
  await connectDB();
  const doc = (await Booking.findOne({ manageTokenHash: hashManageToken(rawToken) })
    .select('+manageTokenHash manageTokenExpiresAt')
    .lean()) as unknown as TokenBookingDoc | null;
  if (!doc) return null;
  if (doc.manageTokenExpiresAt && doc.manageTokenExpiresAt.getTime() < Date.now()) return null;
  return doc;
}

export async function getBookingByToken(rawToken: string): Promise<BookingData | null> {
  const doc = await findBookingByToken(rawToken);
  return doc ? toBookingData(doc) : null;
}

function assertCancellable(doc: TokenBookingDoc, settings: BookingSettingsData) {
  if (doc.status === 'cancelled') throw new BookingError('This booking is already cancelled', 409);
  if (doc.status === 'completed' || doc.status === 'no_show') {
    throw new BookingError('This booking can no longer be changed', 409);
  }
  const cutoffMs = settings.cancellationCutoffHours * 3_600_000;
  if (doc.startAt.getTime() - Date.now() < cutoffMs) {
    throw new BookingError('It is too late to change this booking online — please contact us', 409);
  }
}

export async function cancelBookingByToken(rawToken: string): Promise<BookingData> {
  const doc = await findBookingByToken(rawToken);
  if (!doc) throw new BookingError('Booking not found or link expired', 404);
  const settings = await getBookingSettings();
  assertCancellable(doc, settings);
  const updated = await Booking.findByIdAndUpdate(doc._id, { $set: { status: 'cancelled' } }, { new: true }).lean();
  return toBookingData(updated as unknown as BookingDoc);
}

export async function rescheduleBookingByToken(rawToken: string, newStartAt: Date): Promise<BookingData> {
  const doc = await findBookingByToken(rawToken);
  if (!doc) throw new BookingError('Booking not found or link expired', 404);
  const settings = await getBookingSettings();
  assertCancellable(doc, settings);

  const service = await getServiceById(doc.serviceId);
  if (!service || !service.active) throw new BookingError('This service is no longer available', 409);
  const date = dateStrInZone(newStartAt, settings.timezone);
  const slots = await getAvailabilityForDate({ service, resourceId: doc.resourceId || undefined, date });
  const slot = slots.find((candidate) => candidate.startAt.getTime() === newStartAt.getTime());
  if (!slot) throw new BookingError('That time is no longer available', 409);

  const updated = await Booking.findByIdAndUpdate(
    doc._id,
    { $set: { startAt: slot.startAt, endAt: slot.endAt } },
    { new: true }
  ).lean();
  return toBookingData(updated as unknown as BookingDoc);
}

export async function setBookingStatus(id: string, status: BookingStatus) {
  await connectDB();
  const doc = await Booking.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean();
  return doc ? toBookingData(doc as unknown as BookingDoc) : null;
}

export async function listBookings(filter: { status?: BookingStatus; from?: Date; to?: Date; limit?: number }) {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filter.status) query.status = filter.status;
  if (filter.from || filter.to) {
    query.startAt = {
      ...(filter.from ? { $gte: filter.from } : {}),
      ...(filter.to ? { $lte: filter.to } : {})
    };
  }
  const docs = (await Booking.find(query)
    .sort({ startAt: 1 })
    .limit(Math.min(500, filter.limit ?? 200))
    .lean()) as unknown as BookingDoc[];
  return docs.map(toBookingData);
}

export async function getBookingsOverview(now = new Date()) {
  await connectDB();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);
  const weekEnd = new Date(dayStart.getTime() + 7 * 86_400_000);
  const [todayCount, pendingCount, weekCount, upcoming] = await Promise.all([
    Booking.countDocuments({ startAt: { $gte: dayStart, $lt: dayEnd }, status: { $in: [...ACTIVE_BOOKING_STATUSES] } }),
    Booking.countDocuments({ status: 'requested' }),
    Booking.countDocuments({ startAt: { $gte: dayStart, $lt: weekEnd }, status: { $in: [...ACTIVE_BOOKING_STATUSES] } }),
    Booking.find({ startAt: { $gte: now }, status: { $in: [...ACTIVE_BOOKING_STATUSES] } })
      .sort({ startAt: 1 })
      .limit(5)
      .lean() as unknown as Promise<BookingDoc[]>
  ]);
  return {
    todayCount,
    pendingCount,
    weekCount,
    upcoming: upcoming.map(toBookingData)
  };
}

/** Delete terminal bookings older than the retention window. Returns deleted count. */
export async function purgeOldBookings() {
  await connectDB();
  const settings = await getBookingSettings();
  const cutoff = new Date(Date.now() - settings.retentionDays * 86_400_000);
  const result = await Booking.deleteMany({
    status: { $in: ['cancelled', 'completed', 'no_show'] },
    updatedAt: { $lt: cutoff }
  });
  return result.deletedCount ?? 0;
}
