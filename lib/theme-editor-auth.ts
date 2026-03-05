import { NextResponse } from 'next/server';
import { getRequestOrigin, normalizeOrigin, verifyThemeEditorJwt } from '@/lib/theme-editor-jwt';

const THEME_EDITOR_ALLOWED_ROLES = new Set(['super', 'customer', 'admin', 'user']);
const THEME_EDITOR_COOKIE = 'vd_theme_token';

function extractBearerToken(request: Request) {
  const auth = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!auth) return null;
  const normalized = auth.trim().replace(/^"+|"+$/g, '');
  const match = normalized.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function extractCookieToken(request: Request) {
  const raw = request.headers.get('cookie');
  if (!raw) return null;
  const parts = raw.split(';');
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=');
    if (name === THEME_EDITOR_COOKIE) {
      const value = rest.join('=');
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return null;
}

function extractThemeEditorToken(request: Request) {
  return extractBearerToken(request) || extractCookieToken(request);
}

export function hasThemeEditorToken(request: Request) {
  return Boolean(extractThemeEditorToken(request));
}

export async function requireThemeEditorToken(request: Request) {
  const rawToken = extractThemeEditorToken(request);
  if (!rawToken) {
    return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  try {
    const payload = await verifyThemeEditorJwt(rawToken);

    const canonical = process.env.CANONICAL_ORIGIN ? normalizeOrigin(process.env.CANONICAL_ORIGIN) : null;
    const requestOrigin = canonical ?? getRequestOrigin(request);
    if (normalizeOrigin(payload.siteOrigin) !== normalizeOrigin(requestOrigin)) {
      return {
        ok: false as const,
        response: NextResponse.json({ error: 'Token origin mismatch' }, { status: 401 })
      };
    }

    const normalizedRole = String(payload.role || '').toLowerCase();
    if (!THEME_EDITOR_ALLOWED_ROLES.has(normalizedRole)) {
      return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }

    return { ok: true as const, payload: { ...payload, role: normalizedRole } };
  } catch {
    return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
}
