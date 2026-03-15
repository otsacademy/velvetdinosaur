import type {
  AnalyticsTouchSnapshot,
  SiteAnalyticsEvent,
  SiteAnalyticsLead
} from '@/lib/analytics/schema';

type AnalyticsMetadataValue = string | number | boolean | null;

const VISITOR_COOKIE = 'vd_vid';
const SESSION_COOKIE = 'vd_sid';
const ATTRIBUTION_FIRST_COOKIE = 'vd_attr_first';
const ATTRIBUTION_LAST_COOKIE = 'vd_attr_last';
const LANDING_COOKIE = 'vd_landing';

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseCookie(cookieHeader: string, name: string) {
  const encodedName = `${name}=`;
  const part = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(encodedName));

  if (!part) return '';
  try {
    return decodeURIComponent(part.slice(encodedName.length));
  } catch {
    return part.slice(encodedName.length);
  }
}

function parseJsonCookie<T>(cookieHeader: string, name: string) {
  const raw = parseCookie(cookieHeader, name);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function resolveSiteSlug() {
  return clean(process.env.SITE_SLUG).toLowerCase();
}

function resolveSiteDomain(request: Request) {
  const candidates = [
    clean(process.env.CANONICAL_ORIGIN),
    clean(process.env.NEXT_PUBLIC_BASE_URL),
    clean(process.env.PUBLIC_BASE_URL),
    clean(process.env.DOMAIN),
    clean(request.headers.get('host'))
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
        return new URL(candidate).hostname.toLowerCase();
      }
      return candidate.replace(/:\d+$/, '').toLowerCase();
    } catch {
      continue;
    }
  }

  return '';
}

function resolveAnalyticsBaseUrl() {
  const raw = clean(process.env.VD_ANALYTICS_INGEST_URL);
  if (!raw) return '';

  const trimmed = raw.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/analytics/ingest')) {
    return trimmed.replace(/\/api\/analytics\/ingest$/, '');
  }

  return trimmed;
}

function resolveAnalyticsEndpoint(kind: 'event' | 'lead') {
  const base = resolveAnalyticsBaseUrl();
  if (!base) return '';

  if (kind === 'event') return `${base}/api/analytics/ingest`;
  return `${base}/api/analytics/leads/upsert`;
}

function readClientIp(request: Request) {
  const forwarded = clean(request.headers.get('x-forwarded-for'));
  if (forwarded) {
    return forwarded
      .split(',')
      .map((part) => part.trim())
      .find(Boolean) || '';
  }

  return clean(request.headers.get('x-real-ip'));
}

function inferCurrentPagePath(request: Request, siteDomain: string) {
  const referer = clean(request.headers.get('referer'));
  if (!referer) return '';

  try {
    const refererUrl = new URL(referer);
    if (siteDomain && refererUrl.hostname.toLowerCase() !== siteDomain) {
      return '';
    }

    const search = refererUrl.search || '';
    return `${refererUrl.pathname || '/'}${search}`;
  } catch {
    return '';
  }
}

function readAttribution(request: Request) {
  const cookieHeader = clean(request.headers.get('cookie'));
  return {
    visitorId: parseCookie(cookieHeader, VISITOR_COOKIE),
    sessionId: parseCookie(cookieHeader, SESSION_COOKIE),
    landingPath: parseCookie(cookieHeader, LANDING_COOKIE),
    firstTouch: parseJsonCookie<AnalyticsTouchSnapshot>(cookieHeader, ATTRIBUTION_FIRST_COOKIE),
    lastTouch: parseJsonCookie<AnalyticsTouchSnapshot>(cookieHeader, ATTRIBUTION_LAST_COOKIE)
  };
}

function withIdentity(
  request: Request,
  siteDomain: string,
  payload: SiteAnalyticsEvent | SiteAnalyticsLead
) {
  const attribution = readAttribution(request);
  const path = clean(payload.path) || inferCurrentPagePath(request, siteDomain);

  return {
    occurredAt: clean(payload.occurredAt) || new Date().toISOString(),
    visitorId: clean(payload.visitorId) || attribution.visitorId || undefined,
    sessionId: clean(payload.sessionId) || attribution.sessionId || undefined,
    path: path || undefined,
    landingPath: clean(payload.landingPath) || attribution.landingPath || path || undefined,
    referrer: clean(payload.referrer) || attribution.lastTouch?.referrer || undefined,
    firstTouch: payload.firstTouch || attribution.firstTouch || undefined,
    lastTouch: payload.lastTouch || attribution.lastTouch || undefined
  };
}

async function postToAnalytics(
  request: Request,
  endpoint: string,
  body: Record<string, unknown>
) {
  const apiKey = clean(process.env.VD_ANALYTICS_INGEST_API_KEY);
  const siteSlug = resolveSiteSlug();
  const siteDomain = resolveSiteDomain(request);

  if (!endpoint || !apiKey || !siteSlug) {
    return { ok: false, skipped: true as const };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-vd-analytics-key': apiKey,
        'x-vd-forwarded-for': readClientIp(request),
        'x-vd-original-user-agent': clean(request.headers.get('user-agent'))
      },
      body: JSON.stringify({
        siteSlug,
        siteDomain,
        ...body
      }),
      cache: 'no-store',
      signal: controller.signal
    });

    return { ok: response.ok, skipped: false as const };
  } catch (error) {
    console.warn(
      '[analytics] forward failed:',
      error instanceof Error ? error.message : String(error)
    );
    return { ok: false, skipped: false as const };
  } finally {
    clearTimeout(timer);
  }
}

export async function forwardAnalyticsEvent(request: Request, event: SiteAnalyticsEvent) {
  const siteDomain = resolveSiteDomain(request);
  const identity = withIdentity(request, siteDomain, event);

  return postToAnalytics(request, resolveAnalyticsEndpoint('event'), {
    ...event,
    ...identity
  });
}

export async function createAnalyticsLead(
  request: Request,
  lead: SiteAnalyticsLead & {
    metadata?: Record<string, AnalyticsMetadataValue>;
  }
) {
  const siteDomain = resolveSiteDomain(request);
  const identity = withIdentity(request, siteDomain, lead);

  return postToAnalytics(request, resolveAnalyticsEndpoint('lead'), {
    ...lead,
    ...identity
  });
}
