import { NextResponse } from 'next/server';
import { getRequestOrigin, normalizeOrigin } from '@/lib/theme-editor-jwt';

// Default to the production designer host unless a site explicitly overrides it.
const DEFAULT_THEME_EDITOR_ORIGIN = 'https://designer.velvetdinosaur.com';
const LEGACY_THEME_EDITOR_ORIGIN = 'https://theme.velvetdinosaur.com';

export function getThemeEditorOrigin() {
  return (process.env.THEME_EDITOR_ORIGIN || DEFAULT_THEME_EDITOR_ORIGIN).replace(/\/+$/, '');
}

const CORS_ALLOW_HEADERS = 'Authorization, Content-Type';
const CORS_ALLOW_METHODS = 'GET, POST, OPTIONS';
const CORS_ALLOW_CREDENTIALS = 'true';

function getAllowedOrigins(request: Request) {
  const themeEditorOrigin = normalizeOrigin(getThemeEditorOrigin());
  const designerOrigin = normalizeOrigin(DEFAULT_THEME_EDITOR_ORIGIN);
  const legacyOrigin = normalizeOrigin(LEGACY_THEME_EDITOR_ORIGIN);
  const requestOrigin = normalizeOrigin(getRequestOrigin(request));
  const canonical = process.env.CANONICAL_ORIGIN ? normalizeOrigin(process.env.CANONICAL_ORIGIN) : null;
  return new Set([themeEditorOrigin, designerOrigin, legacyOrigin, requestOrigin, canonical].filter(Boolean));
}

export function corsPreflight(request: Request) {
  const origin = request.headers.get('origin');
  const allowed = getAllowedOrigins(request);
  if (!origin) {
    return NextResponse.json({ error: 'Missing Origin' }, { status: 400 });
  }
  if (!allowed.has(normalizeOrigin(origin))) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }

  const res = new NextResponse(null, { status: 204 });
  res.headers.set('Access-Control-Allow-Origin', origin);
  res.headers.set('Vary', 'Origin');
  res.headers.set('Access-Control-Allow-Headers', CORS_ALLOW_HEADERS);
  res.headers.set('Access-Control-Allow-Methods', CORS_ALLOW_METHODS);
  res.headers.set('Access-Control-Allow-Credentials', CORS_ALLOW_CREDENTIALS);
  res.headers.set('Access-Control-Max-Age', '86400');
  return res;
}

export function enforceThemeEditorCors(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return null;
  const allowed = getAllowedOrigins(request);
  if (!allowed.has(normalizeOrigin(origin))) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }
  return null;
}

export function withThemeEditorCorsHeaders(request: Request, response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  const origin = request.headers.get('origin');
  if (!origin) return response;
  const allowed = getAllowedOrigins(request);
  if (allowed.has(normalizeOrigin(origin))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
    response.headers.set('Access-Control-Allow-Headers', CORS_ALLOW_HEADERS);
    response.headers.set('Access-Control-Allow-Methods', CORS_ALLOW_METHODS);
    response.headers.set('Access-Control-Allow-Credentials', CORS_ALLOW_CREDENTIALS);
  }
  return response;
}
