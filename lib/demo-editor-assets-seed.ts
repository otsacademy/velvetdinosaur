type SeedAssetInput = {
  key: string;
  url: string;
  name: string;
  alt: string;
  caption: string;
  folder: string;
  width: number;
  height: number;
  createdAt: string;
  mime?: string;
  size?: number;
};

export const SEED_FOLDERS: { path: string; label?: string }[] = [
  { path: 'newsletter', label: 'Newsletter demo' },
  { path: 'harbour-pine/branding', label: 'Harbour & Pine / Branding' },
  { path: 'harbour-pine/rooms', label: 'Harbour & Pine / Rooms' },
  { path: 'harbour-pine/materials', label: 'Harbour & Pine / Materials' },
  { path: 'harbour-pine/styling', label: 'Harbour & Pine / Styling' },
  { path: 'news/hero-shoot', label: 'Editorial Demo / Hero Shoot' },
  { path: 'news/interviews', label: 'Editorial Demo / Interviews' },
  { path: 'news/diagrams', label: 'Editorial Demo / Diagrams' },
  { path: 'travel/stays', label: 'Travel Demo / Stays' },
  { path: 'travel/routes', label: 'Travel Demo / Routes' },
  { path: 'travel/booking-api', label: 'Travel Demo / Booking API' }
];

export const SEED_ASSETS: SeedAssetInput[] = [
  { key: 'seed-newsletter-image', url: '/assets/demo-media/newsletter/sample.png', name: 'Newsletter example image.png', alt: 'An example website preview', caption: 'A sample image for the newsletter demo.', folder: 'newsletter', width: 1440, height: 654, createdAt: '2026-09-18T10:00:00.000Z', mime: 'image/png', size: 341260 },
  { key: 'seed-newsletter-pdf', url: '/assets/demo-media/newsletter/sample.pdf', name: 'Newsletter information.pdf', alt: '', caption: '', folder: 'newsletter', width: 0, height: 0, createdAt: '2026-09-18T10:01:00.000Z', mime: 'application/pdf', size: 666 },
  {
    key: 'seed-brand-board',
    url: '/assets/demo-media/harbour-pine/branding/brand-board.svg',
    name: 'Brand board',
    alt: 'Harbour & Pine brand board',
    caption: 'Fictional brand board with warm neutrals, green accents, and terracotta notes.',
    folder: 'harbour-pine/branding',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T08:00:00.000Z'
  },
  {
    key: 'seed-living-room-concept',
    url: '/assets/demo-media/harbour-pine/rooms/living-room-concept.svg',
    name: 'Living room concept',
    alt: 'Fictional living room concept board',
    caption: 'Soft seating, timber notes, and a calm palette for a fictional living-room scheme.',
    folder: 'harbour-pine/rooms',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T08:05:00.000Z'
  },
  {
    key: 'seed-kitchen-joinery-study',
    url: '/assets/demo-media/harbour-pine/rooms/kitchen-joinery-study.svg',
    name: 'Kitchen joinery study',
    alt: 'Fictional kitchen joinery concept board',
    caption: 'Joinery-led kitchen concept with layered cabinetry and practical storage planning.',
    folder: 'harbour-pine/rooms',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T08:10:00.000Z'
  },
  {
    key: 'seed-oak-and-limewash-board',
    url: '/assets/demo-media/harbour-pine/materials/oak-and-limewash-board.svg',
    name: 'Oak and limewash board',
    alt: 'Fictional oak and limewash material board',
    caption: 'Material study pairing pale oak, soft plaster tones, and dark green accents.',
    folder: 'harbour-pine/materials',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T08:15:00.000Z'
  },
  {
    key: 'seed-stone-and-brass-board',
    url: '/assets/demo-media/harbour-pine/materials/stone-and-brass-board.svg',
    name: 'Stone and brass board',
    alt: 'Fictional stone and brass material board',
    caption: 'Stone, brass, and painted cabinetry references for a warmer kitchen palette.',
    folder: 'harbour-pine/materials',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T08:20:00.000Z'
  },
  {
    key: 'seed-lighting-and-textiles-board',
    url: '/assets/demo-media/harbour-pine/styling/lighting-and-textiles-board.svg',
    name: 'Lighting and textiles board',
    alt: 'Fictional styling board with lighting and textiles',
    caption: 'Lighting shapes, upholstery, and accessory references for the finishing layer.',
    folder: 'harbour-pine/styling',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T08:25:00.000Z'
  },
  {
    key: 'seed-news-cover-board',
    url: '/assets/demo-media/news/hero-shoot/cover-story-board.svg',
    name: 'Cover story board',
    alt: 'Fictional editorial cover board',
    caption: 'Editorial collage used for the fictional article editor demo.',
    folder: 'news/hero-shoot',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T09:00:00.000Z'
  },
  {
    key: 'seed-news-founder-portrait',
    url: '/assets/demo-media/news/interviews/founder-portrait.svg',
    name: 'Founder portrait',
    alt: 'Fictional portrait illustration for a demo interview',
    caption: 'Illustrated portrait used for the fictional Sauro CMS news demo.',
    folder: 'news/interviews',
    width: 1200,
    height: 1200,
    createdAt: '2026-03-23T09:05:00.000Z'
  },
  {
    key: 'seed-news-studio-notes',
    url: '/assets/demo-media/news/interviews/studio-notes-board.svg',
    name: 'Studio notes board',
    alt: 'Fictional interview notes board',
    caption: 'A make-believe interview notes board for the editorial sandbox.',
    folder: 'news/interviews',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T09:10:00.000Z'
  },
  {
    key: 'seed-news-content-ops',
    url: '/assets/demo-media/news/diagrams/content-ops-diagram.svg',
    name: 'Content operations diagram',
    alt: 'Fictional content operations diagram',
    caption: 'Diagram showing a fictional editorial workflow from brief to refresh.',
    folder: 'news/diagrams',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T09:15:00.000Z'
  },
  {
    key: 'seed-travel-tide-house',
    url: '/assets/demo-media/travel/stays/tide-house-lounge.svg',
    name: 'Tide House lounge',
    alt: 'Fictional stay image for Tide House',
    caption: 'Coastal lounge scene for the fictional Tide House stay.',
    folder: 'travel/stays',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T09:30:00.000Z'
  },
  {
    key: 'seed-travel-ember-lake',
    url: '/assets/demo-media/travel/stays/ember-lake-cabin.svg',
    name: 'Ember Lake cabin',
    alt: 'Fictional stay image for Ember Lake Cabins',
    caption: 'Timber cabin scene for the fictional lake stay demo.',
    folder: 'travel/stays',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T09:31:00.000Z'
  },
  {
    key: 'seed-travel-olive-courtyard',
    url: '/assets/demo-media/travel/stays/olive-courtyard-house.svg',
    name: 'Olive Courtyard House',
    alt: 'Fictional stay image for Olive Courtyard House',
    caption: 'Sunlit courtyard scene for the fictional Mediterranean stay.',
    folder: 'travel/stays',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T09:32:00.000Z'
  },
  {
    key: 'seed-travel-atlas-salt',
    url: '/assets/demo-media/travel/stays/atlas-salt-house.svg',
    name: 'Atlas Salt House',
    alt: 'Fictional stay image for Atlas Salt House',
    caption: 'Desert-terrace stay scene for the fictional route and stay demo.',
    folder: 'travel/stays',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T09:33:00.000Z'
  },
  {
    key: 'seed-travel-coastal-route',
    url: '/assets/demo-media/travel/routes/coastal-foraging-loop.svg',
    name: 'Coastal Foraging Loop',
    alt: 'Fictional route board for Coastal Foraging Loop',
    caption: 'Route graphic for a fictional coastal food and walking programme.',
    folder: 'travel/routes',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T09:34:00.000Z'
  },
  {
    key: 'seed-travel-lake-route',
    url: '/assets/demo-media/travel/routes/stone-and-fire-loop.svg',
    name: 'Stone and Fire Loop',
    alt: 'Fictional route board for Stone and Fire Loop',
    caption: 'Route graphic pairing lake cabins with ridgeline walking.',
    folder: 'travel/routes',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T09:35:00.000Z'
  },
  {
    key: 'seed-travel-olive-route',
    url: '/assets/demo-media/travel/routes/tramuntana-olive-road.svg',
    name: 'Tramuntana Olive Road',
    alt: 'Fictional route board for Tramuntana Olive Road',
    caption: 'Mediterranean route graphic for the fictional travel demo.',
    folder: 'travel/routes',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T09:36:00.000Z'
  },
  {
    key: 'seed-travel-atlas-route',
    url: '/assets/demo-media/travel/routes/atlas-supper-trail.svg',
    name: 'Atlas Supper Trail',
    alt: 'Fictional route board for Atlas Supper Trail',
    caption: 'Desert route graphic linking guided supper experiences and stays.',
    folder: 'travel/routes',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T09:37:00.000Z'
  },
  {
    key: 'seed-travel-booking-overview',
    url: '/assets/demo-media/travel/booking-api/pipeline-overview.svg',
    name: 'Booking board overview',
    alt: 'Fictional booking dashboard visual',
    caption: 'Illustrated booking board showing the fictional travel pipeline.',
    folder: 'travel/booking-api',
    width: 1600,
    height: 1000,
    createdAt: '2026-03-23T09:38:00.000Z'
  }
];
