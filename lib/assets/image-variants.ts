export const ASSET_IMAGE_VARIANT_NAMES = [
  'thumbnail',
  'card',
  'inline',
  'hero',
  'avatar',
  'social'
] as const;

export type AssetImageVariantName = (typeof ASSET_IMAGE_VARIANT_NAMES)[number];

export type AssetImageVariantConfig = {
  width: number;
  height: number;
  format: 'webp' | 'jpeg' | 'png' | 'avif';
  quality: number;
  fit: 'cover' | 'inside';
};

export type AssetImageVariantRecord = AssetImageVariantConfig & {
  key: string;
  mime: string;
  size: number;
};

export type AssetImageVariantMap = Partial<Record<AssetImageVariantName, AssetImageVariantRecord>>;

export const ASSET_IMAGE_VARIANTS: Record<AssetImageVariantName, AssetImageVariantConfig> = {
  thumbnail: {
    width: 320,
    height: 320,
    format: 'webp',
    quality: 76,
    fit: 'cover'
  },
  card: {
    width: 768,
    height: 512,
    format: 'webp',
    quality: 80,
    fit: 'cover'
  },
  inline: {
    width: 1280,
    height: 1280,
    format: 'webp',
    quality: 82,
    fit: 'inside'
  },
  hero: {
    width: 1920,
    height: 1080,
    format: 'webp',
    quality: 84,
    fit: 'cover'
  },
  avatar: {
    width: 256,
    height: 256,
    format: 'webp',
    quality: 80,
    fit: 'cover'
  },
  social: {
    width: 1200,
    height: 630,
    format: 'jpeg',
    quality: 86,
    fit: 'cover'
  }
};

const OPTIMIZABLE_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif'
]);

const IMAGE_UPLOAD_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'avif',
  'svg',
  'gif'
]);

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm'
};

export function normalizeAssetImageIntent(value: unknown): AssetImageVariantName | null {
  if (typeof value !== 'string') return null;
  return ASSET_IMAGE_VARIANT_NAMES.includes(value as AssetImageVariantName)
    ? (value as AssetImageVariantName)
    : null;
}

export function normalizeAssetExtension(value: unknown, fallback = 'bin') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim().toLowerCase().replace(/^\.+/, '');
  const safe = trimmed.replace(/[^a-z0-9]+/g, '');
  return safe || fallback;
}

export function getExtensionFromFilename(filename: string, fallback = 'bin') {
  if (!filename) return fallback;
  const parts = filename.split('.');
  if (parts.length < 2) return fallback;
  return normalizeAssetExtension(parts.pop(), fallback);
}

export function getOriginalExtension(filename: string, mime: string) {
  const normalizedMime = mime.toLowerCase();
  return getExtensionFromFilename(filename, EXTENSION_BY_MIME[normalizedMime] || 'bin');
}

export function getPublicExtensionForUpload(filename: string, mime: string) {
  if (isOptimizableImageMime(mime)) return 'webp';
  return getOriginalExtension(filename, mime);
}

export function isOptimizableImageMime(mime: unknown) {
  return typeof mime === 'string' && OPTIMIZABLE_IMAGE_MIME_TYPES.has(mime.toLowerCase());
}

export function isImageUploadMime(mime: unknown, filename?: string) {
  if (typeof mime === 'string' && mime.toLowerCase().startsWith('image/')) return true;
  if (!filename) return false;
  return IMAGE_UPLOAD_EXTENSIONS.has(getExtensionFromFilename(filename, '').toLowerCase());
}

export function getMimeForVariantFormat(format: AssetImageVariantConfig['format']) {
  if (format === 'jpeg') return 'image/jpeg';
  if (format === 'png') return 'image/png';
  if (format === 'avif') return 'image/avif';
  return 'image/webp';
}

export function getExtensionForVariantFormat(format: AssetImageVariantConfig['format']) {
  return format === 'jpeg' ? 'jpg' : format;
}

export function buildVariantKey(
  publicKey: string,
  variant: AssetImageVariantName,
  options?: { inlineAsPublicKey?: boolean }
) {
  const config = ASSET_IMAGE_VARIANTS[variant];
  if (variant === 'inline' && options?.inlineAsPublicKey !== false) return publicKey;
  const ext = getExtensionForVariantFormat(config.format);
  const withoutExtension = publicKey.replace(/\.[^/.]+$/, '');
  return `${withoutExtension}--${variant}.${ext}`;
}

export function selectAssetVariantKey(
  asset: {
    key?: string;
    fallbackKey?: string;
    variants?: AssetImageVariantMap | null;
  } | null,
  intent: AssetImageVariantName | null
) {
  if (!asset) return null;
  if (intent) {
    const variantKey = asset.variants?.[intent]?.key;
    if (variantKey) return variantKey;
  }
  return asset.fallbackKey || asset.variants?.inline?.key || asset.key || null;
}
