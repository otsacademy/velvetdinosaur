type DemoUploadedFileResult = {
  key: string;
  url: string;
  name: string;
  size: number;
  type: string;
  folder?: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
};

type DemoUploadOptions = {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
  name?: string;
  caption?: string;
  alt?: string;
  folder?: string;
  width?: number;
  height?: number;
};

type DemoAssetFolderItem = {
  path: string;
  label?: string;
};

type DemoAssetListItem = {
  key: string;
  name?: string;
  caption?: string;
  alt?: string;
  folder?: string;
  mime?: string;
  size?: number;
  width?: number;
  height?: number;
  createdAt?: string;
};

type DemoAssetRecord = DemoAssetListItem & {
  url: string;
};

type DemoAssetListOptions = {
  q?: string;
  mimePrefix?: string;
  folder?: string | null;
  limit?: number;
  cursor?: string | null;
  sort?: 'newest' | 'oldest';
};

type DemoAssetListResult = {
  items: DemoAssetListItem[];
  nextCursor: string | null;
  sort: 'newest' | 'oldest';
};

const DEMO_IMAGE_MIME = 'image/svg+xml';

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
};

const SEED_FOLDERS: DemoAssetFolderItem[] = [
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

const SEED_ASSETS: SeedAssetInput[] = [
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

function createSeedState() {
  return {
    folders: SEED_FOLDERS.map((item) => ({ ...item })),
    assets: SEED_ASSETS.map(
      (asset): DemoAssetRecord => ({
        key: asset.key,
        url: asset.url,
        name: asset.name,
        alt: asset.alt,
        caption: asset.caption,
        folder: asset.folder,
        mime: DEMO_IMAGE_MIME,
        size: 0,
        width: asset.width,
        height: asset.height,
        createdAt: asset.createdAt
      })
    )
  };
}

const state = {
  ...createSeedState()
};

function canUseDom() {
  return typeof window !== 'undefined' && typeof URL !== 'undefined';
}

function normalizeFolder(input?: string | null) {
  if (!input) return '';
  return input
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '');
}

function includesQuery(value: string | undefined, query: string) {
  if (!value) return false;
  return value.toLowerCase().includes(query);
}

export function isDemoEditorAssetMode() {
  if (!canUseDom()) return false;
  const pathname = window.location.pathname;
  return (
    pathname === '/demo/new' ||
    pathname.startsWith('/demo/new/') ||
    pathname === '/new' ||
    pathname === '/demo/media' ||
    pathname.startsWith('/demo/media/') ||
    pathname === '/media'
    || pathname === '/demo/news'
    || pathname.startsWith('/demo/news/')
    || pathname === '/news'
    || pathname === '/demo/stays'
    || pathname.startsWith('/demo/stays/')
    || pathname === '/stays'
    || pathname === '/demo/routes'
    || pathname.startsWith('/demo/routes/')
    || pathname === '/routes'
    || pathname === '/demo/bookings'
    || pathname.startsWith('/demo/bookings/')
    || pathname === '/bookings'
  );
}

export function isDirectAssetUrl(value: string) {
  return /^(blob:|data:|https?:\/\/|\/)/i.test(value);
}

export function resolveDemoEditorAssetUrl(key: string) {
  return state.assets.find((asset) => asset.key === key)?.url ?? null;
}

export function resetDemoEditorAssets() {
  if (!canUseDom()) return;
  for (const asset of state.assets) {
    if (asset.url.startsWith('blob:')) {
      URL.revokeObjectURL(asset.url);
    }
  }
  const next = createSeedState();
  state.assets = next.assets;
  state.folders = next.folders;
}

export async function uploadDemoEditorFile(
  file: File,
  options: DemoUploadOptions = {}
): Promise<DemoUploadedFileResult> {
  if (!canUseDom()) {
    throw new Error('Demo uploads are only available in the browser.');
  }
  if (options.signal?.aborted) {
    const abortError = new Error('Upload aborted');
    abortError.name = 'AbortError';
    throw abortError;
  }

  const url = URL.createObjectURL(file);
  const folder = normalizeFolder(options.folder) || undefined;
  const key = url;
  const createdAt = new Date().toISOString();
  const nextRecord: DemoAssetRecord = {
    key,
    url,
    name: options.name || file.name.replace(/\.[^/.]+$/, ''),
    caption: options.caption,
    alt: options.alt,
    folder,
    mime: file.type || 'application/octet-stream',
    size: file.size,
    width: options.width,
    height: options.height,
    createdAt
  };

  options.onProgress?.(100);
  state.assets = [nextRecord, ...state.assets.filter((asset) => asset.key !== key)];

  if (folder && !state.folders.some((entry) => entry.path === folder)) {
    state.folders = [...state.folders, { path: folder, label: folder }];
  }

  return {
    key,
    url,
    name: nextRecord.name || 'Upload',
    size: nextRecord.size || 0,
    type: nextRecord.mime || 'application/octet-stream',
    folder,
    caption: nextRecord.caption,
    alt: nextRecord.alt,
    width: nextRecord.width,
    height: nextRecord.height
  };
}

export async function listDemoEditorAssets(
  options: DemoAssetListOptions = {}
): Promise<DemoAssetListResult> {
  const sort = options.sort === 'oldest' ? 'oldest' : 'newest';
  const normalizedQuery = (options.q || '').trim().toLowerCase();
  const normalizedMimePrefix = (options.mimePrefix || '').trim().toLowerCase();
  const normalizedFolder = options.folder === null ? null : normalizeFolder(options.folder);
  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.min(100, Number(options.limit))) : 24;
  const offset = options.cursor ? Number(options.cursor) : 0;
  const safeOffset = Number.isFinite(offset) && offset > 0 ? offset : 0;

  const filtered = state.assets.filter((asset) => {
    if (normalizedQuery) {
      const matchesQuery =
        includesQuery(asset.key, normalizedQuery) ||
        includesQuery(asset.name, normalizedQuery) ||
        includesQuery(asset.caption, normalizedQuery) ||
        includesQuery(asset.alt, normalizedQuery);
      if (!matchesQuery) return false;
    }

    if (normalizedMimePrefix) {
      const mime = (asset.mime || '').toLowerCase();
      if (!mime.startsWith(normalizedMimePrefix)) return false;
    }

    if (normalizedFolder === null) {
      return true;
    }

    const assetFolder = normalizeFolder(asset.folder);
    if (normalizedFolder === '') {
      return assetFolder === '';
    }

    return assetFolder === normalizedFolder;
  });

  filtered.sort((a, b) => {
    const left = new Date(a.createdAt || 0).getTime();
    const right = new Date(b.createdAt || 0).getTime();
    return sort === 'oldest' ? left - right : right - left;
  });

  const items = filtered.slice(safeOffset, safeOffset + limit).map((asset) => ({
    key: asset.key,
    name: asset.name,
    caption: asset.caption,
    alt: asset.alt,
    folder: asset.folder,
    mime: asset.mime,
    size: asset.size,
    width: asset.width,
    height: asset.height,
    createdAt: asset.createdAt
  }));
  const nextCursor = safeOffset + limit < filtered.length ? String(safeOffset + limit) : null;

  return { items, nextCursor, sort };
}

export async function updateDemoEditorAssetMetadata(
  key: string,
  update: {
    name?: string;
    caption?: string;
    alt?: string;
    folder?: string;
    width?: number;
    height?: number;
  }
) {
  const nextFolder = normalizeFolder(update.folder) || undefined;
  const current = state.assets.find((asset) => asset.key === key);

  if (!current) {
    throw new Error('Asset not found');
  }

  const updatedRecord: DemoAssetRecord = {
    ...current,
    name: update.name ?? current.name,
    caption: update.caption ?? current.caption,
    alt: update.alt ?? current.alt,
    folder: nextFolder,
    width: update.width ?? current.width,
    height: update.height ?? current.height
  };

  state.assets = state.assets.map((asset) => (asset.key === key ? updatedRecord : asset));

  if (nextFolder && !state.folders.some((entry) => entry.path === nextFolder)) {
    state.folders = [...state.folders, { path: nextFolder, label: nextFolder }];
  }

  return {
    key: updatedRecord.key,
    name: updatedRecord.name,
    caption: updatedRecord.caption,
    alt: updatedRecord.alt,
    folder: updatedRecord.folder,
    width: updatedRecord.width,
    height: updatedRecord.height
  };
}

export async function listDemoEditorAssetFolders(): Promise<DemoAssetFolderItem[]> {
  return [...state.folders].sort((a, b) => a.path.localeCompare(b.path));
}

export async function createDemoEditorAssetFolder(input: {
  path: string;
  label?: string;
}): Promise<DemoAssetFolderItem> {
  const path = normalizeFolder(input.path);
  if (!path) {
    throw new Error('Folder path required');
  }

  const existing = state.folders.find((entry) => entry.path === path);
  if (existing) {
    return existing;
  }

  const item = {
    path,
    label: input.label?.trim() || path
  };
  state.folders = [...state.folders, item];
  return item;
}

export async function deleteDemoEditorAssets(keys: string[]) {
  const keySet = new Set(keys);
  const removed = state.assets.filter((asset) => keySet.has(asset.key));
  for (const asset of removed) {
    if (asset.url.startsWith('blob:')) {
      URL.revokeObjectURL(asset.url);
    }
  }
  state.assets = state.assets.filter((asset) => !keySet.has(asset.key));
  return {
    ok: true,
    results: keys.map((key) => ({ key, ok: true }))
  };
}
