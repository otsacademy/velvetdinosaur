import type {
  AccessEntry,
  ActivitySession,
  DemoSite
} from '../demo-fleet-activity-digest';
import {
  verifyRecipientToken,
  type RecipientLinkRecord
} from './demo-recipient-links';

const SIGNAL_PREFIX = '/api/analytics/demo-recipient/';
const VISIT_PREFIX = '/visit/';
const DELIBERATE_SIGNALS = new Set(['pointer', 'keyboard', 'scroll', 'click']);

type RecipientActivityRules = {
  ignoredIps: Set<string>;
  isAutomatedUserAgent: (userAgent: string) => boolean;
  isSecurityProbePath: (path: string) => boolean;
  visitorFingerprint: (ip: string, userAgent: string) => string;
};

export type RecipientActivity = {
  site: DemoSite;
  recipient: RecipientLinkRecord;
  visitorKey: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  linkOpened: boolean;
  highConfidence: boolean;
  signals: string[];
  pages: string[];
  signInAttempted: boolean;
  signedIn: boolean;
  signedInAt: Date | null;
  browserSession: ActivitySession | null;
};

function decodePage(value: string) {
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8');
    return decoded.startsWith('/') && decoded.length <= 500 ? decoded : '';
  } catch {
    return '';
  }
}

function parseTrackedEntry(entry: AccessEntry) {
  if (entry.path.startsWith(VISIT_PREFIX)) {
    const token = entry.path.slice(VISIT_PREFIX.length).split('/', 1)[0] || '';
    return token ? { token, signal: 'open', page: '' } : null;
  }
  if (!entry.path.startsWith(SIGNAL_PREFIX)) return null;
  const parts = entry.path.slice(SIGNAL_PREFIX.length).split('/');
  if (parts.length !== 3) return null;
  const page = decodePage(parts[2] || '');
  if (!page) return null;
  return { token: parts[1] || '', signal: parts[0] || '', page };
}

function sourceAddress(entry: AccessEntry) {
  return `${entry.host}|${entry.ip}`;
}

export function collectRecipientActivity(
  entries: AccessEntry[],
  sites: DemoSite[],
  browserSessions: ActivitySession[],
  recipients: RecipientLinkRecord[],
  secret: string,
  since: Date,
  until: Date,
  rules: RecipientActivityRules
) {
  const siteByDomain = new Map(sites.map((site) => [site.domain, site]));
  const recipientsById = new Map(recipients.map((recipient) => [recipient.id, recipient]));
  const relevantEntries = entries.filter(
    (entry) => entry.occurredAt > since && entry.occurredAt <= until
  );
  const probeSources = new Set(
    relevantEntries
      .filter((entry) => rules.isSecurityProbePath(entry.path))
      .map(sourceAddress)
  );
  const buckets = new Map<
    string,
    RecipientActivity & { signalSet: Set<string>; pageSet: Set<string> }
  >();

  for (const entry of relevantEntries) {
    const tracked = parseTrackedEntry(entry);
    if (!tracked || entry.status < 200 || entry.status >= 400) continue;
    const site = siteByDomain.get(entry.host);
    if (!site) continue;
    if (
      rules.ignoredIps.has(entry.ip) ||
      rules.isAutomatedUserAgent(entry.userAgent) ||
      probeSources.has(sourceAddress(entry))
    ) {
      continue;
    }
    const payload = verifyRecipientToken(tracked.token, secret, entry.occurredAt);
    const recipient = payload ? recipientsById.get(payload.r) : null;
    if (!payload || !recipient || payload.s !== site.slug || recipient.siteSlug !== site.slug) continue;

    const visitorKey = rules.visitorFingerprint(entry.ip, entry.userAgent);
    const key = `${site.domain}|${recipient.id}|${visitorKey}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        site,
        recipient,
        visitorKey,
        firstSeenAt: entry.occurredAt,
        lastSeenAt: entry.occurredAt,
        linkOpened: false,
        highConfidence: false,
        signals: [],
        signalSet: new Set(),
        pages: [],
        pageSet: new Set(),
        signInAttempted: false,
        signedIn: false,
        signedInAt: null,
        browserSession: null
      };
      buckets.set(key, bucket);
    }
    bucket.lastSeenAt = entry.occurredAt;
    if (tracked.signal === 'open') bucket.linkOpened = true;
    if (!bucket.signalSet.has(tracked.signal)) {
      bucket.signalSet.add(tracked.signal);
      bucket.signals.push(tracked.signal);
    }
    if (tracked.page && !bucket.pageSet.has(tracked.page)) {
      bucket.pageSet.add(tracked.page);
      bucket.pages.push(tracked.page);
    }
  }

  for (const bucket of buckets.values()) {
    const domainSource = `${bucket.site.domain}|${bucket.visitorKey}`;
    bucket.browserSession =
      browserSessions.find(
        (session) => `${session.site.domain}|${session.visitorKey}` === domainSource
      ) || null;

    for (const entry of relevantEntries) {
      if (entry.host !== bucket.site.domain) continue;
      if (rules.visitorFingerprint(entry.ip, entry.userAgent) !== bucket.visitorKey) continue;
      if (entry.method !== 'POST' || !entry.path.startsWith('/api/auth/sign-in/')) continue;
      bucket.signInAttempted = true;
      if (entry.status >= 200 && entry.status < 300) {
        bucket.signedIn = true;
        bucket.signedInAt = entry.occurredAt;
      }
    }

    const deliberate = bucket.signals.some((signal) => DELIBERATE_SIGNALS.has(signal));
    const activeDwell = bucket.signalSet.has('dwell10');
    bucket.highConfidence = bucket.signedIn || (deliberate && activeDwell);
  }

  return Array.from(buckets.values())
    .sort((left, right) => left.firstSeenAt.getTime() - right.firstSeenAt.getTime())
    .map(({ signalSet: _signalSet, pageSet: _pageSet, ...activity }) => activity);
}
