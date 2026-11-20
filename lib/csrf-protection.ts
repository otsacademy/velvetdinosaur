import { NextResponse } from 'next/server';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function isMutatingMethod(method: string) {
  return MUTATING_METHODS.has(method.toUpperCase());
}

function hasBearerAuth(request: Request) {
  const authorization = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authorization) return false;
  return /^Bearer\s+/i.test(authorization.trim());
}

function normalizeOrigin(value: string) {
  return value.replace(/\/+$/, '').toLowerCase();
}

function extractOrigin(value: string | null) {
  if (!value) return null;
  try {
    return normalizeOrigin(new URL(value).origin);
  } catch {
    return null;
  }
}

function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = (forwardedHost || request.headers.get('host') || url.host || '').split(',')[0]?.trim();
  const proto = (forwardedProto || url.protocol.replace(':', '') || 'https').split(',')[0]?.trim();
  return normalizeOrigin(`${proto}://${host}`);
}

function forbidden(message: string) {
  return NextResponse.json(
    { error: message },
    {
      status: 403,
      headers: { 'Cache-Control': 'no-store' }
    }
  );
}

/**
 * Public forms that email links lead to (confirm a subscription or an event
 * registration, unsubscribe) and the newsletter sign-up and account consent
 * endpoints. A page on another site must not be able to submit them for a
 * visitor, with or without cookies: cross-site browser requests and foreign
 * origins are refused. Requests without an Origin header (mail clients and
 * server-side callers) still pass; the routes still require the signed token
 * and the explicit `confirmed: true`.
 */
export function enforceSameOriginForPublicForm(request: Request) {
  if (!isMutatingMethod(request.method)) {
    return null;
  }

  if ((request.headers.get('sec-fetch-site') || '').toLowerCase() === 'cross-site') {
    return forbidden('Cross-origin request blocked');
  }

  const callerOrigin = extractOrigin(request.headers.get('origin'));
  if (!callerOrigin) {
    return null;
  }

  const allowedOrigins = new Set(
    [getRequestOrigin(request), extractOrigin(process.env.CANONICAL_ORIGIN || null), extractOrigin(process.env.PUBLIC_BASE_URL || null)]
      .filter((origin): origin is string => Boolean(origin))
  );
  return allowedOrigins.has(callerOrigin) ? null : forbidden('Cross-origin request blocked');
}

export function enforceSameOriginForCookieMutation(request: Request) {
  if (!isMutatingMethod(request.method)) {
    return null;
  }

  if (hasBearerAuth(request)) {
    return null;
  }

  const cookie = request.headers.get('cookie');
  if (!cookie) {
    return null;
  }

  const callerOrigin =
    extractOrigin(request.headers.get('origin')) || extractOrigin(request.headers.get('referer'));

  if (!callerOrigin) {
    return forbidden('Origin required');
  }

  const requestOrigin = getRequestOrigin(request);
  if (callerOrigin !== requestOrigin) {
    return forbidden('Cross-origin request blocked');
  }

  return null;
}
