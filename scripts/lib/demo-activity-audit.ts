export type TrafficAuditEntry = {
  host: string;
  ip: string;
  occurredAt: Date;
  method: string;
  path: string;
  status: number;
  referer: string;
  userAgent: string;
};

export type TrafficAuditSite = {
  domain: string;
};

export type TrafficAuditSession = {
  site: TrafficAuditSite;
  visitorKey: string;
};

export type SiteTrafficAudit = {
  domain: string;
  browserLikeSources: number;
  excludedSources: number;
  ownerOrQaSources: number;
  automatedAgentSources: number;
  securityProbeSources: number;
  signInAttempts: number;
};

type AuditRules = {
  ignoredIps: Set<string>;
  isAutomatedUserAgent: (userAgent: string) => boolean;
  isLikelyPagePath: (path: string) => boolean;
  isSecurityProbePath: (path: string) => boolean;
  visitorFingerprint: (ip: string, userAgent: string) => string;
};

function refererHost(referer: string) {
  try {
    return new URL(referer).hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function collectTrafficAudit(
  entries: TrafficAuditEntry[],
  sites: TrafficAuditSite[],
  sessions: TrafficAuditSession[],
  since: Date,
  until: Date,
  rules: AuditRules
) {
  const siteByDomain = new Map(sites.map((site) => [site.domain, site]));
  const reported = new Set(
    sessions.map((session) => `${session.site.domain}|${session.visitorKey}`)
  );
  const buckets = new Map(
    sites.map((site) => [
      site.domain,
      {
        observed: new Set<string>(),
        excluded: new Set<string>(),
        ownerOrQa: new Set<string>(),
        automated: new Set<string>(),
        probes: new Set<string>(),
        signInAttempts: 0
      }
    ])
  );

  for (const entry of entries) {
    if (entry.occurredAt <= since || entry.occurredAt > until) continue;
    const site = siteByDomain.get(entry.host) || siteByDomain.get(refererHost(entry.referer));
    if (!site) continue;
    const bucket = buckets.get(site.domain);
    if (!bucket) continue;

    const rawSource = `${entry.ip}|${entry.userAgent}`;
    if (rules.isSecurityProbePath(entry.path)) bucket.probes.add(rawSource);
    if (entry.method === 'POST' && entry.path.startsWith('/api/auth/sign-in/')) {
      bucket.signInAttempts += 1;
    }

    const relevant =
      (entry.method === 'GET' && entry.status < 400 && rules.isLikelyPagePath(entry.path)) ||
      (entry.method === 'POST' &&
        (entry.path === '/api/analytics' ||
          entry.path === '/api/vd-telemetry' ||
          entry.path.startsWith('/api/auth/sign-in/')));
    if (!relevant) continue;
    if (rules.isAutomatedUserAgent(entry.userAgent)) {
      bucket.automated.add(rawSource);
      continue;
    }

    const visitorKey = rules.visitorFingerprint(entry.ip, entry.userAgent);
    const source = `${site.domain}|${visitorKey}`;
    bucket.observed.add(source);
    if (!reported.has(source)) bucket.excluded.add(source);
    if (rules.ignoredIps.has(entry.ip)) bucket.ownerOrQa.add(source);
  }

  return sites.map((site): SiteTrafficAudit => {
    const bucket = buckets.get(site.domain)!;
    return {
      domain: site.domain,
      browserLikeSources: bucket.observed.size,
      excludedSources: bucket.excluded.size,
      ownerOrQaSources: bucket.ownerOrQa.size,
      automatedAgentSources: bucket.automated.size,
      securityProbeSources: bucket.probes.size,
      signInAttempts: bucket.signInAttempts
    };
  });
}
