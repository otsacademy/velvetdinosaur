function joinUrl(base: string, path: string) {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
}

export function r2PublicUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE || process.env.R2_PUBLIC_BASE || '';
  if (!base) return path;
  return joinUrl(base, path);
}

