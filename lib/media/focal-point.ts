export type FocalPoint = {
  focalX?: number | null;
  focalY?: number | null;
};

export const FOCAL_POSITION_PRECISION = 4;
export const DEFAULT_FOCAL_VALUE = 0.5;

function roundToPrecision(value: number) {
  const factor = 10 ** FOCAL_POSITION_PRECISION;
  return Math.round(value * factor) / factor;
}

export function clamp01(input: unknown): number | undefined {
  if (typeof input === 'string' && input.trim() === '') return undefined;
  const value = typeof input === 'number' ? input : Number(input);
  if (!Number.isFinite(value)) return undefined;
  const clamped = Math.min(1, Math.max(0, value));
  return roundToPrecision(clamped);
}

export function focalToObjectPosition(input: FocalPoint = {}, fallback: FocalPoint = {}): string {
  const normalizedX = clamp01(input.focalX);
  const normalizedY = clamp01(input.focalY);
  const resolvedX = normalizedX ?? clamp01(fallback.focalX) ?? DEFAULT_FOCAL_VALUE;
  const resolvedY = normalizedY ?? clamp01(fallback.focalY) ?? DEFAULT_FOCAL_VALUE;
  return `${(resolvedX * 100).toFixed(FOCAL_POSITION_PRECISION)}% ${(resolvedY * 100).toFixed(
    FOCAL_POSITION_PRECISION
  )}%`;
}

export function parseFocalFromUrl(url?: string): FocalPoint {
  if (typeof url !== 'string' || !url) return {};
  try {
    const normalized = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')
      ? url
      : `http://localhost${url.startsWith('/') ? '' : '/'}${url}`;
    const parsed = new URL(normalized);
    const focalX = clamp01(parsed.searchParams.get('focalX') ?? undefined);
    const focalY = clamp01(parsed.searchParams.get('focalY') ?? undefined);
    return { focalX, focalY };
  } catch {
    return {};
  }
}

export function toFocalQuery(input: FocalPoint = {}): Record<string, string> | null {
  const focalX = clamp01(input.focalX);
  const focalY = clamp01(input.focalY);
  if (focalX === undefined && focalY === undefined) return null;
  const params: Record<string, string> = {};
  if (focalX !== undefined) params.focalX = String(focalX);
  if (focalY !== undefined) params.focalY = String(focalY);
  return params;
}

export function buildFocalAwareAssetUrl(url: string, focalPoint: FocalPoint = {}): string {
  const query = toFocalQuery(focalPoint);
  if (!query) return url;
  try {
    const base = new URL(url, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
    for (const [key, value] of Object.entries(query)) {
      base.searchParams.set(key, value);
    }
    return `${base.pathname}${base.search}`;
  } catch {
    return url;
  }
}
