import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/event-registration/event-context.ts');

import { format } from 'date-fns';
import { connectDB } from '@/lib/db';
import {
  deriveEventDateParts,
  normalizeEventLocationType,
  normalizeEventRegistrationMode,
  normalizeEventSlug
} from '@/lib/events';
import { Event } from '@/models/Event';
import { clean, toIdString } from '@/lib/event-registration/shared';

type EventDoc = {
  _id?: unknown;
  slug?: string;
  title?: string;
  startDateTime?: Date | string | null;
  endDateTime?: Date | string | null;
  venueName?: string;
  venueAddress?: string;
  locationType?: string;
  ticketUrl?: string;
  registrationMode?: string;
  joiningInstructions?: string;
  status?: string;
};

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveLocation(row: EventDoc) {
  const locationType = normalizeEventLocationType(clean(row.locationType));
  const venueAddress = clean(row.venueAddress);
  const venueName = clean(row.venueName) || (locationType === 'virtual' ? 'Online' : 'Venue TBA');
  if (locationType === 'virtual') {
    return { venue: venueName, location: 'Virtual' };
  }
  if (locationType === 'hybrid') {
    return {
      venue: venueName,
      location: venueAddress ? `Hybrid / ${venueAddress}` : 'Hybrid'
    };
  }
  return {
    venue: venueName,
    location: venueAddress || 'Location TBA'
  };
}

function buildDateLabel(row: EventDoc) {
  const start = toDate(row.startDateTime);
  const end = toDate(row.endDateTime);
  if (!start || !end) return 'Date TBA';
  const parts = deriveEventDateParts(start, end);
  return `${format(start, 'MMMM d, yyyy')} @ ${parts.startTime} - ${parts.endTime}`;
}

export type EventRegistrationContext = {
  id: string;
  slug: string;
  title: string;
  dateLabel: string;
  venue: string;
  location: string;
  registrationMode: string;
  joiningInstructions: string;
  status: string;
};

export async function getEventRegistrationContextById(eventId: string) {
  await connectDB();
  const row = (await Event.findById(clean(eventId)).lean()) as EventDoc | null;
  if (!row) return null;
  const resolvedLocation = resolveLocation(row);
  return {
    id: toIdString(row._id),
    slug: normalizeEventSlug(clean(row.slug)),
    title: clean(row.title),
    dateLabel: buildDateLabel(row),
    venue: resolvedLocation.venue,
    location: resolvedLocation.location,
    registrationMode: normalizeEventRegistrationMode(clean(row.registrationMode), clean(row.ticketUrl)),
    joiningInstructions: clean(row.joiningInstructions),
    status: clean(row.status) || 'draft'
  } satisfies EventRegistrationContext;
}
