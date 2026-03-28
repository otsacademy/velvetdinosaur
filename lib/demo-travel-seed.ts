import type { Stay } from '@/lib/content/types';

export type DemoTravelInventoryKind = 'stay' | 'route';

export type DemoTravelStay = Stay & {
  status: 'live' | 'draft';
  linkedRouteSlugs: string[];
  region: string;
};

export type DemoTravelRoute = {
  slug: string;
  name: string;
  region: string;
  durationDays: number;
  durationNights: number;
  season: string;
  summary: string;
  status: 'active' | 'draft';
  heroImage: string;
  staySlugs: string[];
  itinerary: string[];
  seats: number;
  price: number;
  currency: string;
  isStartingFrom: boolean;
};

export type DemoTravelInventoryItem = {
  slug: string;
  name: string;
  kind: DemoTravelInventoryKind;
  region: string;
  capacity: number | null;
  price: number | null;
  currency: string | null;
  isStartingFrom: boolean;
  status: 'active' | 'draft';
  linkedStaySlugs: string[];
};

export type DemoTravelProduct = {
  id?: string | null;
  slug: string;
  kind: DemoTravelInventoryKind;
  name: string;
  status: 'active' | 'inactive';
  currency: string;
  priceAmount: number;
  capacity?: number;
  updatedAt?: string;
};

export type DemoTravelBooking = {
  id?: string | null;
  type: 'enquiry' | 'booking' | 'lead';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  guest: {
    name: string;
    email: string;
    phone?: string;
  };
  providerRef?: string;
  productSlug?: string | null;
  source?: string;
  createdAt: string;
  partySize?: number;
  notes?: string;
  requestedDates?: string[];
};

export type DemoTravelAvailabilitySlot = {
  date: string;
  status: 'available' | 'unavailable' | 'limited';
  remaining?: number;
  price?: number;
};

export type DemoTravelSeed = {
  tenantSlug: string;
  stays: DemoTravelStay[];
  routes: DemoTravelRoute[];
  inventory: DemoTravelInventoryItem[];
  products: DemoTravelProduct[];
  bookings: DemoTravelBooking[];
  availability: Record<string, DemoTravelAvailabilitySlot[]>;
};

const GBP = 'GBP';

function createAvailabilitySeries(
  basePrice: number,
  entries: Array<{ date: string; status: DemoTravelAvailabilitySlot['status']; remaining?: number; priceOffset?: number }>
) {
  return entries.map((entry) => ({
    date: entry.date,
    status: entry.status,
    remaining: entry.remaining,
    price: basePrice + (entry.priceOffset || 0),
  }));
}

export function createDemoTravelSeed(): DemoTravelSeed {
  const stays: DemoTravelStay[] = [
    {
      slug: 'tide-house',
      name: 'Tide House',
      region: 'North Cornwall',
      status: 'live',
      location: 'Port Quin, North Cornwall',
      type: 'Sea-view townhouse',
      summary: 'A salt-washed base with a reading room, a long kitchen table, and quick access to the coast path.',
      description:
        'Tide House is a fictional four-room property used in the travel demo. It is designed as the stay anchor for slow coastal weekends, maker-led retreats, and routes with a strong food element.',
      heroImage: '/assets/demo-media/travel/stays/tide-house-lounge.svg',
      gallery: [
        '/assets/demo-media/travel/stays/tide-house-lounge.svg',
        '/assets/demo-media/travel/routes/coastal-foraging-loop.svg',
      ],
      price: 285,
      currency: GBP,
      isStartingFrom: true,
      badges: ['Sea view', 'Chef-ready kitchen', 'Coastal route base'],
      amenities: ['Breakfast pantry', 'Guided shoreline walks', 'Outdoor rinse station'],
      policies: ['Minimum two nights', 'Private chef on request', 'Dogs by arrangement'],
      details: { guests: 6, bedrooms: 3, bathrooms: 2, size: '180 sqm', externalId: 1201 },
      linkedRouteSlugs: ['coastal-foraging-loop'],
    },
    {
      slug: 'ember-lake-cabins',
      name: 'Ember Lake Cabins',
      region: 'Lake District',
      status: 'live',
      location: 'Ullswater, Cumbria',
      type: 'Cabin cluster',
      summary: 'A wooded cabin base for walking weekends, fire-led suppers, and guide-led route planning.',
      description:
        'Ember Lake Cabins is a fictional cluster of timber cabins used to demo a stay inventory with seasonal demand, family capacity, and route links.',
      heroImage: '/assets/demo-media/travel/stays/ember-lake-cabin.svg',
      gallery: [
        '/assets/demo-media/travel/stays/ember-lake-cabin.svg',
        '/assets/demo-media/travel/routes/stone-and-fire-loop.svg',
      ],
      price: 310,
      currency: GBP,
      isStartingFrom: true,
      badges: ['Wood burner', 'Lake access', 'Guide pickup point'],
      amenities: ['Sauna hut', 'Drying room', 'Family cabins'],
      policies: ['Minimum two nights', 'No amplified music', 'Flexible breakfast baskets'],
      details: { guests: 8, bedrooms: 4, bathrooms: 3, size: '220 sqm', externalId: 1202 },
      linkedRouteSlugs: ['stone-and-fire-loop'],
    },
    {
      slug: 'olive-courtyard-house',
      name: 'Olive Courtyard House',
      region: 'Mallorca',
      status: 'draft',
      location: 'Sóller Valley, Mallorca',
      type: 'Courtyard finca',
      summary: 'A bright finca with orchard breakfasts, studio dinners, and easy route handovers between coast and hills.',
      description:
        'Olive Courtyard House is a fictional Mediterranean property seeded as a draft so prospects can see how unpublished inventory might sit in a travel setup.',
      heroImage: '/assets/demo-media/travel/stays/olive-courtyard-house.svg',
      gallery: [
        '/assets/demo-media/travel/stays/olive-courtyard-house.svg',
        '/assets/demo-media/travel/routes/tramuntana-olive-road.svg',
      ],
      price: 360,
      currency: GBP,
      isStartingFrom: true,
      badges: ['Courtyard pool', 'Orchard breakfast', 'Cycle support'],
      amenities: ['Bike storage', 'Outdoor dining', 'Wellness terrace'],
      policies: ['Three-night minimum', 'Staffed check-in', 'Family-friendly rooms'],
      details: { guests: 10, bedrooms: 5, bathrooms: 4, size: '260 sqm', externalId: 1203 },
      linkedRouteSlugs: ['tramuntana-olive-road'],
    },
    {
      slug: 'atlas-salt-house',
      name: 'Atlas Salt House',
      region: 'Morocco',
      status: 'live',
      location: 'Agafay edge, Marrakech region',
      type: 'Desert lodge',
      summary: 'A warm stone lodge built for low-light dinners, long table conversations, and desert route departures.',
      description:
        'Atlas Salt House is a fictional desert-edge property showing how a premium stay can connect to route programming and booking operations without using real client data.',
      heroImage: '/assets/demo-media/travel/stays/atlas-salt-house.svg',
      gallery: [
        '/assets/demo-media/travel/stays/atlas-salt-house.svg',
        '/assets/demo-media/travel/routes/atlas-supper-trail.svg',
      ],
      price: 425,
      currency: GBP,
      isStartingFrom: true,
      badges: ['Desert terrace', 'Private hammam', 'Route transfer point'],
      amenities: ['Sunrise tea service', 'Private guide room', 'Rooftop supper deck'],
      policies: ['Two-night minimum', 'Private transfer included', 'Family suites available'],
      details: { guests: 12, bedrooms: 6, bathrooms: 6, size: '340 sqm', externalId: 1204 },
      linkedRouteSlugs: ['atlas-supper-trail'],
    },
  ];

  const routes: DemoTravelRoute[] = [
    {
      slug: 'coastal-foraging-loop',
      name: 'Coastal Foraging Loop',
      region: 'North Cornwall',
      durationDays: 3,
      durationNights: 2,
      season: 'April to September',
      summary: 'A maker-led coastal route with tide walks, seaweed workshops, and one long harbour supper.',
      status: 'active',
      heroImage: '/assets/demo-media/travel/routes/coastal-foraging-loop.svg',
      staySlugs: ['tide-house'],
      itinerary: ['Harbour arrival and kitchen setup', 'Tide walk with local guide', 'Studio dinner and departure breakfast'],
      seats: 10,
      price: 890,
      currency: GBP,
      isStartingFrom: true,
    },
    {
      slug: 'stone-and-fire-loop',
      name: 'Stone and Fire Loop',
      region: 'Lake District',
      durationDays: 4,
      durationNights: 3,
      season: 'Year round',
      summary: 'A walking and fire-cooking route with cabin nights, ridge mornings, and a lakeside finish.',
      status: 'active',
      heroImage: '/assets/demo-media/travel/routes/stone-and-fire-loop.svg',
      staySlugs: ['ember-lake-cabins'],
      itinerary: ['Cabin arrival and fire-cooking brief', 'Ridgeline walk with checkpoint lunch', 'Lakeside workshop and final supper'],
      seats: 12,
      price: 1120,
      currency: GBP,
      isStartingFrom: true,
    },
    {
      slug: 'tramuntana-olive-road',
      name: 'Tramuntana Olive Road',
      region: 'Mallorca',
      durationDays: 5,
      durationNights: 4,
      season: 'March to October',
      summary: 'A slow Mediterranean route pairing orchard stays, small producer visits, and sea-facing dinners.',
      status: 'draft',
      heroImage: '/assets/demo-media/travel/routes/tramuntana-olive-road.svg',
      staySlugs: ['olive-courtyard-house', 'tide-house'],
      itinerary: ['Courtyard welcome lunch', 'Mountain road transfer and tasting', 'Sea-view final dinner with studio briefing'],
      seats: 14,
      price: 1480,
      currency: GBP,
      isStartingFrom: true,
    },
    {
      slug: 'atlas-supper-trail',
      name: 'Atlas Supper Trail',
      region: 'Marrakech region',
      durationDays: 4,
      durationNights: 3,
      season: 'October to April',
      summary: 'A desert-edge route with market sourcing, long-table suppers, and guided sunrise sections.',
      status: 'active',
      heroImage: '/assets/demo-media/travel/routes/atlas-supper-trail.svg',
      staySlugs: ['atlas-salt-house'],
      itinerary: ['Medina sourcing and kitchen prep', 'Desert terrace supper service', 'Sunrise route and departure brunch'],
      seats: 8,
      price: 1325,
      currency: GBP,
      isStartingFrom: true,
    },
  ];

  const stayInventory: DemoTravelInventoryItem[] = stays.map((stay) => ({
      slug: stay.slug,
      name: stay.name,
      kind: 'stay' as const,
      region: stay.region,
      capacity: stay.details?.guests ?? null,
      price: stay.price ?? null,
      currency: stay.currency ?? GBP,
      isStartingFrom: stay.isStartingFrom ?? true,
      status: stay.status === 'live' ? 'active' : 'draft',
      linkedStaySlugs: [],
    }));

  const routeInventory: DemoTravelInventoryItem[] = routes.map((route) => ({
      slug: route.slug,
      name: route.name,
      kind: 'route' as const,
      region: route.region,
      capacity: route.seats,
      price: route.price,
      currency: route.currency,
      isStartingFrom: route.isStartingFrom,
      status: route.status,
      linkedStaySlugs: route.staySlugs,
    }));

  const inventory: DemoTravelInventoryItem[] = [...stayInventory, ...routeInventory];

  const products: DemoTravelProduct[] = [
    {
      id: 'prod_1201',
      slug: 'tide-house',
      kind: 'stay',
      name: 'Tide House',
      status: 'active',
      currency: GBP,
      priceAmount: 285,
      capacity: 6,
      updatedAt: '2026-03-23T09:12:00.000Z',
    },
    {
      id: 'prod_1202',
      slug: 'ember-lake-cabins',
      kind: 'stay',
      name: 'Ember Lake Cabins',
      status: 'active',
      currency: GBP,
      priceAmount: 310,
      capacity: 8,
      updatedAt: '2026-03-23T09:14:00.000Z',
    },
    {
      id: 'prod_1203',
      slug: 'olive-courtyard-house',
      kind: 'stay',
      name: 'Olive Courtyard House',
      status: 'inactive',
      currency: GBP,
      priceAmount: 360,
      capacity: 10,
      updatedAt: '2026-03-23T08:40:00.000Z',
    },
    {
      id: 'prod_1204',
      slug: 'atlas-salt-house',
      kind: 'stay',
      name: 'Atlas Salt House',
      status: 'active',
      currency: GBP,
      priceAmount: 425,
      capacity: 12,
      updatedAt: '2026-03-23T09:10:00.000Z',
    },
    {
      id: 'prod_2201',
      slug: 'coastal-foraging-loop',
      kind: 'route',
      name: 'Coastal Foraging Loop',
      status: 'active',
      currency: GBP,
      priceAmount: 890,
      capacity: 10,
      updatedAt: '2026-03-23T09:11:00.000Z',
    },
    {
      id: 'prod_2202',
      slug: 'stone-and-fire-loop',
      kind: 'route',
      name: 'Stone and Fire Loop',
      status: 'active',
      currency: GBP,
      priceAmount: 1120,
      capacity: 12,
      updatedAt: '2026-03-23T09:09:00.000Z',
    },
    {
      id: 'prod_2204',
      slug: 'atlas-supper-trail',
      kind: 'route',
      name: 'Atlas Supper Trail',
      status: 'active',
      currency: GBP,
      priceAmount: 1325,
      capacity: 8,
      updatedAt: '2026-03-23T09:07:00.000Z',
    },
  ];

  const bookings: DemoTravelBooking[] = [
    {
      id: 'bk_4101',
      type: 'booking',
      status: 'confirmed',
      guest: { name: 'Elena Brooks', email: 'elena@samplemail.dev', phone: '+44 7700 900101' },
      providerRef: 'VD-COAST-784',
      productSlug: 'coastal-foraging-loop',
      source: 'Demo enquiry form',
      createdAt: '2026-03-20T08:30:00.000Z',
      partySize: 2,
      notes: 'Asked for the tide walk to remain on day two.',
      requestedDates: ['2026-05-14', '2026-05-15', '2026-05-16'],
    },
    {
      id: 'bk_4102',
      type: 'enquiry',
      status: 'pending',
      guest: { name: 'Jordan Bell', email: 'jordan@samplemail.dev' },
      productSlug: 'tide-house',
      source: 'Demo stay page',
      createdAt: '2026-03-22T10:20:00.000Z',
      partySize: 4,
      notes: 'Wants a cook-friendly setup and dog access.',
      requestedDates: ['2026-04-18', '2026-04-20'],
    },
    {
      id: 'bk_4103',
      type: 'lead',
      status: 'pending',
      guest: { name: 'Mina Cole', email: 'mina@samplemail.dev', phone: '+44 7700 900103' },
      productSlug: 'tramuntana-olive-road',
      source: 'Demo travel brochure',
      createdAt: '2026-03-22T16:10:00.000Z',
      partySize: 6,
      notes: 'Interested in pairing the route with a two-night pre-stay.',
      requestedDates: ['2026-06-03', '2026-06-07'],
    },
    {
      id: 'bk_4104',
      type: 'booking',
      status: 'completed',
      guest: { name: 'Daniel Sosa', email: 'daniel@samplemail.dev' },
      providerRef: 'VD-LAKE-212',
      productSlug: 'stone-and-fire-loop',
      source: 'Founder follow-up call',
      createdAt: '2026-03-18T09:05:00.000Z',
      partySize: 3,
      notes: 'Returned guest. Wants the same guide pair as last season.',
      requestedDates: ['2026-04-10', '2026-04-13'],
    },
    {
      id: 'bk_4105',
      type: 'enquiry',
      status: 'confirmed',
      guest: { name: 'Priya Ahmed', email: 'priya@samplemail.dev' },
      providerRef: 'VD-DESERT-510',
      productSlug: 'atlas-salt-house',
      source: 'Demo booking board',
      createdAt: '2026-03-21T12:45:00.000Z',
      partySize: 5,
      notes: 'Needs one room kept wheelchair-friendly and airport pickup timings confirmed.',
      requestedDates: ['2026-10-08', '2026-10-11'],
    },
    {
      id: 'bk_4106',
      type: 'lead',
      status: 'cancelled',
      guest: { name: 'Tom Meyer', email: 'tom@samplemail.dev' },
      productSlug: 'ember-lake-cabins',
      source: 'Demo media swipe-up',
      createdAt: '2026-03-19T15:00:00.000Z',
      partySize: 2,
      notes: 'Dates moved out of season before deposit.',
      requestedDates: ['2026-11-15', '2026-11-18'],
    },
  ];

  const availability: Record<string, DemoTravelAvailabilitySlot[]> = {
    'tide-house': createAvailabilitySeries(285, [
      { date: '2026-04-18', status: 'limited', remaining: 1 },
      { date: '2026-04-19', status: 'limited', remaining: 1 },
      { date: '2026-04-20', status: 'available', remaining: 3 },
      { date: '2026-04-21', status: 'available', remaining: 3, priceOffset: 20 },
      { date: '2026-04-22', status: 'unavailable', remaining: 0 },
    ]),
    'ember-lake-cabins': createAvailabilitySeries(310, [
      { date: '2026-04-10', status: 'unavailable', remaining: 0 },
      { date: '2026-04-11', status: 'unavailable', remaining: 0 },
      { date: '2026-04-12', status: 'limited', remaining: 2 },
      { date: '2026-04-13', status: 'available', remaining: 4 },
      { date: '2026-04-14', status: 'available', remaining: 4 },
    ]),
    'olive-courtyard-house': createAvailabilitySeries(360, [
      { date: '2026-06-03', status: 'limited', remaining: 2, priceOffset: 80 },
      { date: '2026-06-04', status: 'limited', remaining: 2, priceOffset: 80 },
      { date: '2026-06-05', status: 'available', remaining: 5, priceOffset: 40 },
      { date: '2026-06-06', status: 'available', remaining: 5, priceOffset: 40 },
      { date: '2026-06-07', status: 'unavailable', remaining: 0 },
    ]),
    'atlas-salt-house': createAvailabilitySeries(425, [
      { date: '2026-10-08', status: 'limited', remaining: 1, priceOffset: 90 },
      { date: '2026-10-09', status: 'limited', remaining: 1, priceOffset: 90 },
      { date: '2026-10-10', status: 'available', remaining: 3, priceOffset: 40 },
      { date: '2026-10-11', status: 'available', remaining: 3, priceOffset: 40 },
      { date: '2026-10-12', status: 'available', remaining: 4 },
    ]),
    'coastal-foraging-loop': createAvailabilitySeries(890, [
      { date: '2026-05-14', status: 'limited', remaining: 2 },
      { date: '2026-05-15', status: 'limited', remaining: 2 },
      { date: '2026-05-16', status: 'available', remaining: 6 },
    ]),
    'stone-and-fire-loop': createAvailabilitySeries(1120, [
      { date: '2026-04-10', status: 'unavailable', remaining: 0 },
      { date: '2026-04-11', status: 'unavailable', remaining: 0 },
      { date: '2026-04-12', status: 'limited', remaining: 3 },
      { date: '2026-04-13', status: 'available', remaining: 6 },
    ]),
    'tramuntana-olive-road': createAvailabilitySeries(1480, [
      { date: '2026-06-03', status: 'limited', remaining: 3, priceOffset: 120 },
      { date: '2026-06-04', status: 'limited', remaining: 3, priceOffset: 120 },
      { date: '2026-06-05', status: 'available', remaining: 7, priceOffset: 80 },
      { date: '2026-06-06', status: 'available', remaining: 7, priceOffset: 80 },
      { date: '2026-06-07', status: 'available', remaining: 7 },
    ]),
    'atlas-supper-trail': createAvailabilitySeries(1325, [
      { date: '2026-10-08', status: 'limited', remaining: 2, priceOffset: 140 },
      { date: '2026-10-09', status: 'limited', remaining: 2, priceOffset: 140 },
      { date: '2026-10-10', status: 'available', remaining: 4, priceOffset: 90 },
      { date: '2026-10-11', status: 'available', remaining: 4, priceOffset: 90 },
    ]),
  };

  return {
    tenantSlug: 'harbour-and-trails-demo',
    stays,
    routes,
    inventory,
    products,
    bookings,
    availability,
  };
}
