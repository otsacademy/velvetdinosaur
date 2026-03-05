export function assetUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) return path;
  return `/assets/${path}`;
}

