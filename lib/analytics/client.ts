'use client';

import type { SiteAnalyticsEvent } from '@/lib/analytics/schema';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

const VISITOR_COOKIE = 'vd_vid';
const SESSION_COOKIE = 'vd_sid';
const ATTRIBUTION_FIRST_COOKIE = 'vd_attr_first';
const ATTRIBUTION_LAST_COOKIE = 'vd_attr_last';
const LANDING_COOKIE = 'vd_landing';
const VISITOR_TTL_SECONDS = 60 * 60 * 24 * 365;
const SESSION_TTL_SECONDS = 60 * 30;
const ATTRIBUTION_TTL_SECONDS = 60 * 60 * 24 * 90;
const EXCLUDED_PREFIXES = ['/admin', '/edit', '/preview', '/api'];

type TouchSnapshot = {
  path?: string;
  referrer?: string;
  referrerDomain?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  occurredAt?: string;
};

type ThirdPartyEvent = Omit<SiteAnalyticsEvent, 'occurredAt'> & {
  occurredAt?: string;
};

function readCookie(name: string) {
  const encoded = `${name}=`;
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(encoded));

  if (!match) return '';
  try {
    return decodeURIComponent(match.slice(encoded.length));
  } catch {
    return match.slice(encoded.length);
  }
}

function writeCookie(name: string, value: string, maxAge: number) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

function readJsonCookie<T>(name: string) {
  const raw = readCookie(name);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJsonCookie(name: string, value: unknown, maxAge: number) {
  writeCookie(name, JSON.stringify(value), maxAge);
}

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureCookieId(name: string, ttlSeconds: number) {
  const existing = readCookie(name);
  const value = existing || generateId();
  writeCookie(name, value, ttlSeconds);
  return value;
}

function shouldTrack(pathname: string) {
  return !EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function extractReferrerDomain(referrer: string) {
  if (!referrer) return '';
  try {
    return new URL(referrer).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function readExternalReferrer() {
  const referrer = document.referrer;
  if (!referrer) return '';

  try {
    const referrerUrl = new URL(referrer);
    if (referrerUrl.hostname === window.location.hostname) return '';
    return referrer;
  } catch {
    return '';
  }
}

function currentTouch(pathWithSearch: string): TouchSnapshot {
  const url = new URL(window.location.href);
  const referrer = readExternalReferrer();

  return {
    path: pathWithSearch,
    referrer,
    referrerDomain: extractReferrerDomain(referrer),
    source: url.searchParams.get('utm_source') || undefined,
    medium: url.searchParams.get('utm_medium') || undefined,
    campaign: url.searchParams.get('utm_campaign') || undefined,
    term: url.searchParams.get('utm_term') || undefined,
    content: url.searchParams.get('utm_content') || undefined,
    occurredAt: new Date().toISOString()
  };
}

function ensureAttribution(pathWithSearch: string) {
  const visitorId = ensureCookieId(VISITOR_COOKIE, VISITOR_TTL_SECONDS);
  const sessionId = ensureCookieId(SESSION_COOKIE, SESSION_TTL_SECONDS);
  const firstTouch = readJsonCookie<TouchSnapshot>(ATTRIBUTION_FIRST_COOKIE);
  const lastTouch = currentTouch(pathWithSearch);
  const landingPath = readCookie(LANDING_COOKIE) || pathWithSearch;

  if (!readCookie(LANDING_COOKIE)) {
    writeCookie(LANDING_COOKIE, pathWithSearch, SESSION_TTL_SECONDS);
  } else {
    writeCookie(LANDING_COOKIE, landingPath, SESSION_TTL_SECONDS);
  }

  if (!firstTouch) {
    writeJsonCookie(ATTRIBUTION_FIRST_COOKIE, lastTouch, ATTRIBUTION_TTL_SECONDS);
  } else {
    writeJsonCookie(ATTRIBUTION_FIRST_COOKIE, firstTouch, ATTRIBUTION_TTL_SECONDS);
  }

  writeJsonCookie(ATTRIBUTION_LAST_COOKIE, lastTouch, ATTRIBUTION_TTL_SECONDS);

  return {
    visitorId,
    sessionId,
    landingPath,
    firstTouch: firstTouch || lastTouch,
    lastTouch
  };
}

export async function trackAnalyticsEvent(
  event: ThirdPartyEvent
) {
  if (process.env.NEXT_PUBLIC_LHCI === 'true') return;
  if (typeof window === 'undefined') return;
  if (navigator.doNotTrack === '1') return;

  const pathname = window.location.pathname;
  if (!shouldTrack(pathname)) return;

  const pathWithSearch = `${pathname}${window.location.search || ''}`;
  const identity = ensureAttribution(pathWithSearch);
  dispatchThirdPartyEvent({
    ...event,
    occurredAt: event.occurredAt || new Date().toISOString(),
    visitorId: event.visitorId || identity.visitorId,
    sessionId: event.sessionId || identity.sessionId,
    path: event.path || pathWithSearch,
    landingPath: event.landingPath || identity.landingPath,
    title: event.title || document.title || '',
    referrer: event.referrer || identity.lastTouch.referrer,
    language: event.language || navigator.language || '',
    utmSource: event.utmSource || identity.lastTouch.source,
    utmMedium: event.utmMedium || identity.lastTouch.medium,
    utmCampaign: event.utmCampaign || identity.lastTouch.campaign,
    utmTerm: event.utmTerm || identity.lastTouch.term,
    utmContent: event.utmContent || identity.lastTouch.content,
    firstTouch: event.firstTouch || identity.firstTouch,
    lastTouch: event.lastTouch || identity.lastTouch
  });

  await fetch('/api/analytics', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ...event,
      occurredAt: event.occurredAt || new Date().toISOString(),
      visitorId: event.visitorId || identity.visitorId,
      sessionId: event.sessionId || identity.sessionId,
      path: event.path || pathWithSearch,
      landingPath: event.landingPath || identity.landingPath,
      title: event.title || document.title || '',
      referrer: event.referrer || identity.lastTouch.referrer || '',
      language: event.language || navigator.language || '',
      utmSource: event.utmSource || identity.lastTouch.source,
      utmMedium: event.utmMedium || identity.lastTouch.medium,
      utmCampaign: event.utmCampaign || identity.lastTouch.campaign,
      utmTerm: event.utmTerm || identity.lastTouch.term,
      utmContent: event.utmContent || identity.lastTouch.content,
      firstTouch: event.firstTouch || identity.firstTouch,
      lastTouch: event.lastTouch || identity.lastTouch
    }),
    cache: 'no-store',
    keepalive: true
  }).catch(() => {});
}

export function createAutoAnalytics() {
  const trackedSections = new Set<string>();
  const trackedScroll = new Set<number>();

  const handleClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const explicit = target.closest<HTMLElement>('[data-analytics-event]');
    if (explicit) {
      const eventName = explicit.dataset.analyticsEvent;
      if (!eventName) return;

      void trackAnalyticsEvent({
        eventType: explicit.dataset.analyticsType === 'conversion' ? 'conversion' : 'engagement',
        eventName,
        eventCategory: explicit.dataset.analyticsCategory || 'cta',
        ctaLabel: explicit.dataset.analyticsLabel || explicit.textContent?.trim() || eventName,
        ctaPosition: explicit.dataset.analyticsPosition || undefined,
        sectionId:
          explicit.dataset.analyticsSection ||
          explicit.closest<HTMLElement>('[data-analytics-section], section[id]')?.dataset.analyticsSection ||
          explicit.closest<HTMLElement>('section[id]')?.id ||
          undefined,
        formId: explicit.dataset.analyticsForm || undefined,
        entityType: explicit.dataset.analyticsEntityType || undefined,
        entityId: explicit.dataset.analyticsEntityId || undefined
      });
      return;
    }

    const anchor = target.closest<HTMLAnchorElement>('a[href]');
    if (!anchor) return;

    const href = anchor.getAttribute('href') || '';
    if (!href) return;

    if (href.startsWith('#')) {
      void trackAnalyticsEvent({
        eventType: 'engagement',
        eventName: 'cta_click',
        eventCategory: 'cta',
        ctaLabel: anchor.textContent?.trim() || href,
        sectionId:
          anchor.closest<HTMLElement>('[data-analytics-section], section[id]')?.dataset.analyticsSection ||
          anchor.closest<HTMLElement>('section[id]')?.id ||
          undefined,
        metadata: { target: href }
      });
      return;
    }

    let eventName = '';
    if (href.startsWith('mailto:')) eventName = 'email_click';
    else if (href.startsWith('tel:')) eventName = 'phone_click';
    else {
      try {
        const resolved = new URL(anchor.href, window.location.href);
        if (resolved.hostname !== window.location.hostname) {
          eventName = 'outbound_click';
        }
      } catch {
        return;
      }
    }

    if (!eventName) return;

    void trackAnalyticsEvent({
      eventType: 'engagement',
      eventName,
      eventCategory: 'cta',
      ctaLabel: anchor.textContent?.trim() || href,
      sectionId:
        anchor.closest<HTMLElement>('[data-analytics-section], section[id]')?.dataset.analyticsSection ||
        anchor.closest<HTMLElement>('section[id]')?.id ||
        undefined,
      metadata: { href: anchor.href }
    });
  };

  const handleScroll = () => {
    const doc = document.documentElement;
    const total = doc.scrollHeight - window.innerHeight;
    if (total <= 0) return;

    const ratio = Math.round((window.scrollY / total) * 100);
    for (const threshold of [25, 50, 75, 90]) {
      if (ratio < threshold || trackedScroll.has(threshold)) continue;
      trackedScroll.add(threshold);
      void trackAnalyticsEvent({
        eventType: 'engagement',
        eventName: `scroll_${threshold}`,
        eventCategory: 'engagement',
        metadata: { depth: threshold }
      });
    }
  };

  const observer =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting || entry.intersectionRatio < 0.45) continue;
              const element = entry.target as HTMLElement;
              const sectionId = element.dataset.analyticsSection || element.id;
              if (!sectionId || trackedSections.has(sectionId)) continue;
              trackedSections.add(sectionId);
              void trackAnalyticsEvent({
                eventType: 'engagement',
                eventName: 'section_view',
                eventCategory: 'engagement',
                sectionId,
                metadata: { section: sectionId }
              });
            }
          },
          { threshold: [0.45] }
        );

  const observeSections = () => {
    if (!observer) return;
    document
      .querySelectorAll<HTMLElement>('[data-analytics-section], section[id]')
      .forEach((element) => observer.observe(element));
  };

  document.addEventListener('click', handleClick, true);
  window.addEventListener('scroll', handleScroll, { passive: true });
  observeSections();
  handleScroll();

  return () => {
    document.removeEventListener('click', handleClick, true);
    window.removeEventListener('scroll', handleScroll);
    observer?.disconnect();
  };
}

export function shouldTrackPath(pathname: string) {
  return shouldTrack(pathname);
}

export function buildPageViewPayload(pathWithSearch: string): SiteAnalyticsEvent {
  const identity = ensureAttribution(pathWithSearch);
  const url = new URL(window.location.href);

  return {
    eventType: 'page_view',
    eventName: 'page_view',
    eventCategory: 'page',
    occurredAt: new Date().toISOString(),
    visitorId: identity.visitorId,
    sessionId: identity.sessionId,
    path: pathWithSearch,
    landingPath: identity.landingPath,
    title: document.title || '',
    referrer: identity.lastTouch.referrer,
    language: navigator.language || '',
    utmSource: url.searchParams.get('utm_source') || identity.lastTouch.source,
    utmMedium: url.searchParams.get('utm_medium') || identity.lastTouch.medium,
    utmCampaign: url.searchParams.get('utm_campaign') || identity.lastTouch.campaign,
    utmTerm: url.searchParams.get('utm_term') || identity.lastTouch.term,
    utmContent: url.searchParams.get('utm_content') || identity.lastTouch.content,
    firstTouch: identity.firstTouch,
    lastTouch: identity.lastTouch
  };
}

function pickThirdPartyValue(
  event: ThirdPartyEvent,
  pathWithSearch: string
): Record<string, string | number> {
  const output: Record<string, string | number> = {
    page_path: event.path || pathWithSearch
  };

  const eventName = event.eventName || event.conversionName || event.eventType;
  if (eventName) output.event_name = eventName;
  if (event.formId) output.form_id = event.formId;
  if (event.sectionId) output.section_id = event.sectionId;
  if (event.ctaLabel) output.cta_label = event.ctaLabel;
  if (event.ctaPosition) output.cta_position = event.ctaPosition;
  if (event.entityType) output.entity_type = event.entityType;
  if (event.entityId) output.entity_id = event.entityId;

  const numericValue =
    typeof event.value === 'number'
      ? event.value
      : typeof event.conversionValue === 'number'
        ? event.conversionValue
        : undefined;
  if (typeof numericValue === 'number' && Number.isFinite(numericValue)) {
    output.value = numericValue;
  }
  if (event.currency) output.currency = event.currency;

  return output;
}

function resolveMetaEventName(event: ThirdPartyEvent) {
  const eventName = (event.eventName || event.conversionName || '').toLowerCase();
  if (eventName.includes('newsletter') || eventName.includes('waitlist')) {
    return 'CompleteRegistration';
  }
  if (eventName.includes('contact') || eventName.includes('lead') || eventName.includes('booking')) {
    return 'Lead';
  }
  if (event.eventType === 'lead' || event.eventType === 'outcome') {
    return 'Lead';
  }
  return '';
}

function dispatchThirdPartyEvent(event: ThirdPartyEvent) {
  if (typeof window === 'undefined') return;
  if (event.eventType === 'page_view') return;

  const pathWithSearch = `${window.location.pathname}${window.location.search || ''}`;
  const eventName = event.eventName || event.conversionName || event.eventType;
  const params = pickThirdPartyValue(event, pathWithSearch);

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }

  const metaEvent = resolveMetaEventName(event);
  if (metaEvent && typeof window.fbq === 'function') {
    window.fbq('track', metaEvent, params);
  }
}
