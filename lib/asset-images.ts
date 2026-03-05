export type AssetImageOptions = {
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  format?: 'auto' | 'avif' | 'webp' | 'jpeg' | 'png';
  dpr?: number;
};

const CF_IMAGE_RESIZE_ENABLED = process.env.NEXT_PUBLIC_CF_IMAGE_RESIZE === 'true';
const DEFAULT_IMAGE_QUALITY = Number(process.env.NEXT_PUBLIC_CF_IMAGE_QUALITY || '85');
const DEFAULT_IMAGE_FORMAT = process.env.NEXT_PUBLIC_CF_IMAGE_FORMAT || 'auto';

const CF_TRACE_SESSION_KEY = '__vd_cf_trace_available';
const CF_IMAGE_SESSION_KEY = '__vd_cf_image_available';

let cfTraceProbe: Promise<boolean> | null = null;
let cfImageProbe: Promise<boolean> | null = null;

async function probeCloudflareTrace(): Promise<boolean> {
  // Cloudflare adds /cdn-cgi/trace on proxied zones. On origin, this will 404.
  try {
    const res = await fetch('/cdn-cgi/trace', { cache: 'no-store' });
    if (!res.ok) return false;
    const text = await res.text();
    return /(^|\n)ip=/.test(text) && /(^|\n)colo=/.test(text);
  } catch {
    return false;
  }
}

async function probeCloudflareImageResizing(): Promise<boolean> {
  // Image Resizing is an optional Cloudflare feature. Even on proxied zones it may be disabled.
  // We probe it against a local asset we expect to exist on all sites.
  try {
    const res = await fetch('/cdn-cgi/image/width=8,quality=1,format=auto/favicon.png', { cache: 'no-store' });
    if (!res.ok) return false;
    const type = res.headers.get('content-type') || '';
    return type.startsWith('image/');
  } catch {
    return false;
  }
}

function readSessionFlag(key: string): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.sessionStorage.getItem(key);
    if (value === '1') return true;
    if (value === '0') return false;
  } catch {
    // ignore storage errors
  }
  return null;
}

function writeSessionFlag(key: string, value: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, value ? '1' : '0');
  } catch {
    // ignore storage errors
  }
}

function ensureProbeStarted(key: string, current: Promise<boolean> | null, probe: () => Promise<boolean>) {
  if (typeof window === 'undefined') return current;
  if (current) return current;
  const next = probe().then((available) => {
    writeSessionFlag(key, available);
    return available;
  });
  return next;
}

function shouldUseCdn() {
  // Never emit /cdn-cgi/image URLs unless we can prove it is supported on this origin.
  if (!CF_IMAGE_RESIZE_ENABLED) return false;
  if (typeof window === 'undefined') return false;

  const traceOk = readSessionFlag(CF_TRACE_SESSION_KEY);
  if (traceOk === null) {
    cfTraceProbe = ensureProbeStarted(CF_TRACE_SESSION_KEY, cfTraceProbe, probeCloudflareTrace);
    return false;
  }
  if (!traceOk) return false;

  const imageOk = readSessionFlag(CF_IMAGE_SESSION_KEY);
  if (imageOk === null) {
    cfImageProbe = ensureProbeStarted(CF_IMAGE_SESSION_KEY, cfImageProbe, probeCloudflareImageResizing);
    return false;
  }
  return imageOk;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeImageParams(options?: AssetImageOptions) {
  const params: string[] = [];
  if (typeof options?.width === 'number' && Number.isFinite(options.width)) {
    params.push(`width=${Math.round(options.width)}`);
  }
  if (typeof options?.height === 'number' && Number.isFinite(options.height)) {
    params.push(`height=${Math.round(options.height)}`);
  }
  if (options?.fit) {
    params.push(`fit=${options.fit}`);
  }
  if (typeof options?.dpr === 'number' && Number.isFinite(options.dpr)) {
    params.push(`dpr=${clampNumber(Math.round(options.dpr), 1, 3)}`);
  }
  const quality =
    typeof options?.quality === 'number' && Number.isFinite(options.quality)
      ? clampNumber(Math.round(options.quality), 1, 100)
      : Number.isFinite(DEFAULT_IMAGE_QUALITY)
        ? clampNumber(Math.round(DEFAULT_IMAGE_QUALITY), 1, 100)
        : null;
  if (quality) {
    params.push(`quality=${quality}`);
  }
  const format = options?.format || DEFAULT_IMAGE_FORMAT;
  if (format) {
    params.push(`format=${format}`);
  }
  return params.join(',');
}

export function buildCdnImageUrl(src: string, options?: AssetImageOptions) {
  if (!shouldUseCdn()) return src;
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return src;
  if (src.includes('/cdn-cgi/image/')) return src;
  const params = normalizeImageParams(options);
  if (!params) return src;

  if (src.startsWith('http://') || src.startsWith('https://')) {
    // Prefer same-origin relative URLs to avoid proxy/path normalization issues with `https://` in the path.
    if (typeof window !== 'undefined') {
      try {
        const parsed = new URL(src);
        if (parsed.origin === window.location.origin) {
          const relative = `${parsed.pathname}${parsed.search}`;
          const normalized = relative.startsWith('/') ? relative : `/${relative}`;
          return `/cdn-cgi/image/${params}${normalized}`;
        }
      } catch {
        // ignore URL parse errors
      }
    }
    return `/cdn-cgi/image/${params}/${src}`;
  }

  const normalized = src.startsWith('/') ? src : `/${src}`;
  return `/cdn-cgi/image/${params}${normalized}`;
}

export function resolveAssetImageUrl(src: string, options?: AssetImageOptions) {
  if (!shouldUseCdn()) return src;
  if (!src || src.includes('/cdn-cgi/image/')) return src;
  if (src.includes('/api/assets/file')) {
    return buildCdnImageUrl(src, options);
  }
  return src;
}

