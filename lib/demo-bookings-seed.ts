// Fictional booking data for the sandboxed demo workspace at /bookings.
// Mirrors the real booking engine's shapes (lib/booking/shared.ts) so the demo
// shows exactly what a customer site's booking admin looks like.

export type DemoBookingService = {
  id: string;
  name: string;
  slug: string;
  description: string;
  durationMinutes: number;
  bufferMinutes: number;
  pricePence: number | null;
  active: boolean;
  sortOrder: number;
};

export type DemoBookingResource = {
  id: string;
  name: string;
  email: string;
  serviceIds: string[];
  active: boolean;
  sortOrder: number;
};

export type DemoBookingStatus = 'requested' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export type DemoBooking = {
  id: string;
  serviceId: string;
  serviceName: string;
  resourceId: string;
  resourceName: string;
  customer: { name: string; email: string; phone: string };
  startAt: string;
  endAt: string;
  status: DemoBookingStatus;
  source: 'public' | 'admin';
  notes: string;
};

export type DemoVenueHours = { day: number; open: boolean; start: string; end: string };

export type DemoBookingsSeed = {
  services: DemoBookingService[];
  resources: DemoBookingResource[];
  bookings: DemoBooking[];
  venueHours: DemoVenueHours[];
  exceptions: { date: string; note: string }[];
};

function at(dayOffset: number, time: string) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function iso(dayOffset: number, time: string) {
  return at(dayOffset, time).toISOString();
}

function addMinutes(isoDate: string, minutes: number) {
  return new Date(new Date(isoDate).getTime() + minutes * 60_000).toISOString();
}

export function createDemoBookingsSeed(): DemoBookingsSeed {
  const services: DemoBookingService[] = [
    {
      id: 'svc-cut',
      name: 'Cut & Finish',
      slug: 'cut-and-finish',
      description: 'Consultation, cut and blow-dry finish.',
      durationMinutes: 45,
      bufferMinutes: 15,
      pricePence: 3200,
      active: true,
      sortOrder: 1
    },
    {
      id: 'svc-restyle',
      name: 'Restyle',
      slug: 'restyle',
      description: 'A bigger change — restyle cut with finish.',
      durationMinutes: 60,
      bufferMinutes: 15,
      pricePence: 4500,
      active: true,
      sortOrder: 2
    },
    {
      id: 'svc-colour',
      name: 'Colour & Cut',
      slug: 'colour-and-cut',
      description: 'Full colour with cut and finish.',
      durationMinutes: 105,
      bufferMinutes: 15,
      pricePence: 6800,
      active: true,
      sortOrder: 3
    },
    {
      id: 'svc-beard',
      name: 'Beard Trim',
      slug: 'beard-trim',
      description: 'Shape, trim and hot towel finish.',
      durationMinutes: 20,
      bufferMinutes: 10,
      pricePence: 1400,
      active: true,
      sortOrder: 4
    }
  ];

  const resources: DemoBookingResource[] = [
    {
      id: 'res-amelia',
      name: 'Amelia',
      email: 'amelia@example.com',
      serviceIds: [],
      active: true,
      sortOrder: 1
    },
    {
      id: 'res-josh',
      name: 'Josh',
      email: 'josh@example.com',
      serviceIds: ['svc-cut', 'svc-beard'],
      active: true,
      sortOrder: 2
    }
  ];

  const booking = (
    id: string,
    serviceId: string,
    resourceId: string,
    dayOffset: number,
    time: string,
    status: DemoBookingStatus,
    customer: { name: string; email: string; phone: string },
    notes = '',
    source: 'public' | 'admin' = 'public'
  ): DemoBooking => {
    const service = services.find((item) => item.id === serviceId)!;
    const resource = resources.find((item) => item.id === resourceId);
    const startAt = iso(dayOffset, time);
    return {
      id,
      serviceId,
      serviceName: service.name,
      resourceId: resource?.id ?? '',
      resourceName: resource?.name ?? '',
      customer,
      startAt,
      endAt: addMinutes(startAt, service.durationMinutes),
      status,
      source,
      notes
    };
  };

  const bookings: DemoBooking[] = [
    booking('bk-1', 'svc-cut', 'res-amelia', 0, '10:30', 'confirmed', {
      name: 'Sarah Milligan',
      email: 'sarah.m@example.com',
      phone: '07700 900461'
    }),
    booking('bk-2', 'svc-colour', 'res-amelia', 0, '13:00', 'confirmed', {
      name: 'Priya Shah',
      email: 'priya.shah@example.com',
      phone: '07700 900462'
    }),
    booking('bk-3', 'svc-beard', 'res-josh', 1, '09:15', 'requested', {
      name: 'Tom Ellery',
      email: 'tom.ellery@example.com',
      phone: ''
    }),
    booking('bk-4', 'svc-restyle', 'res-amelia', 1, '11:00', 'confirmed', {
      name: 'Grace Okafor',
      email: 'grace.o@example.com',
      phone: '07700 900464'
    }),
    booking('bk-5', 'svc-cut', 'res-josh', 2, '14:30', 'requested', {
      name: 'Daniel Reeves',
      email: 'd.reeves@example.com',
      phone: '07700 900465'
    }),
    booking('bk-6', 'svc-cut', 'res-amelia', 3, '16:00', 'confirmed', {
      name: 'Maggie Thornton',
      email: 'maggie.t@example.com',
      phone: ''
    }),
    booking('bk-7', 'svc-cut', 'res-amelia', -1, '12:00', 'completed', {
      name: 'Helen Ward',
      email: 'helen.ward@example.com',
      phone: '07700 900467'
    }),
    booking('bk-8', 'svc-beard', 'res-josh', 2, '10:00', 'cancelled', {
      name: 'Adam Price',
      email: 'adam.price@example.com',
      phone: ''
    }),
    booking(
      'bk-9',
      'svc-colour',
      'res-amelia',
      4,
      '09:30',
      'confirmed',
      { name: 'Ruth Delaney', email: 'ruth.d@example.com', phone: '07700 900469' },
      'First visit — patch test done in store on Tuesday',
      'admin'
    )
  ];

  // Monday–Saturday 09:00–17:30, closed Sunday. (day: 0 = Sunday)
  const venueHours: DemoVenueHours[] = [
    { day: 0, open: false, start: '09:00', end: '17:30' },
    { day: 1, open: true, start: '09:00', end: '17:30' },
    { day: 2, open: true, start: '09:00', end: '17:30' },
    { day: 3, open: true, start: '09:00', end: '17:30' },
    { day: 4, open: true, start: '09:00', end: '17:30' },
    { day: 5, open: true, start: '09:00', end: '17:30' },
    { day: 6, open: true, start: '09:00', end: '17:00' }
  ];

  const exceptions = [{ date: at(21, '00:00').toISOString().slice(0, 10), note: 'Closed — staff training day' }];

  return { services, resources, bookings, venueHours, exceptions };
}
