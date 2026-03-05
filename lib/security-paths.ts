const WELL_KNOWN_SEGMENT = '.well-known';

export function isBlockedPath(pathname: string) {
  if (!pathname) return false;

  if (pathname.includes('..')) {
    return true;
  }

  if (pathname === '/package.json') {
    return true;
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return false;

  if (segments[0] === WELL_KNOWN_SEGMENT) {
    return false;
  }

  for (const segment of segments) {
    if (segment.startsWith('.')) {
      return true;
    }
  }

  return false;
}
