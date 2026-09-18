import { buildCdnImageUrl, type AssetImageOptions } from './asset-images';

export function buildAssetUrl(key: string) {
  return `/api/assets/file?key=${encodeURIComponent(key)}`;
}

export function buildAssetUrlWithFocal(key: string, focalX?: number, focalY?: number) {
  if (focalX === undefined && focalY === undefined) {
    return buildAssetUrl(key);
  }
  const url = new URL(buildAssetUrl(key), 'http://localhost');
  if (focalX !== undefined && Number.isFinite(focalX)) {
    url.searchParams.set('focalX', String(focalX));
  }
  if (focalY !== undefined && Number.isFinite(focalY)) {
    url.searchParams.set('focalY', String(focalY));
  }
  return `${url.pathname}${url.search}`;
}

export function buildAssetImageUrl(key: string, options?: AssetImageOptions) {
  return buildCdnImageUrl(buildAssetUrl(key), options);
}
