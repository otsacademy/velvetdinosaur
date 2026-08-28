export type DigestSite = {
  slug: string;
  name: string;
  url: string;
  domain: string;
};

export type DigestSession = {
  site: DigestSite;
  firstSeenAt: Date;
  lastSeenAt: Date;
  pages: string[];
  signedIn: boolean;
  signedInAt: Date | null;
  browser: string;
  platform: string;
};

export type DigestTrafficAudit = {
  domain: string;
  browserLikeSources: number;
  excludedSources: number;
  ownerOrQaSources: number;
  automatedAgentSources: number;
  securityProbeSources: number;
  signInAttempts: number;
};

export type DigestRecipient = {
  id: string;
  siteSlug: string;
  name: string;
  email: string;
  expiresAt: string;
};

export type DigestRecipientActivity = {
  site: DigestSite;
  recipient: DigestRecipient;
  firstSeenAt: Date;
  lastSeenAt: Date;
  linkOpened: boolean;
  highConfidence: boolean;
  signals: string[];
  pages: string[];
  signInAttempted: boolean;
  signedIn: boolean;
  signedInAt: Date | null;
  browserSession: DigestSession | null;
};

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

export function formatDigest(
  sites: DigestSite[],
  sessions: DigestSession[],
  trafficAudit: DigestTrafficAudit[],
  recipients: DigestRecipient[],
  recipientActivity: DigestRecipientActivity[],
  since: Date,
  until: Date
) {
  const signIns = sessions.filter((session) => session.signedIn).length;
  const trackedLinkOpens = recipientActivity.filter((activity) => activity.linkOpened).length;
  const highConfidenceVisits = recipientActivity.filter(
    (activity) => activity.highConfidence
  ).length;
  const browserLikeSources = trafficAudit.reduce(
    (total, audit) => total + audit.browserLikeSources,
    0
  );
  const subject = `[Velvet Dinosaur] ${sites.length}-demo activity: ${highConfidenceVisits} high-confidence recipient visit${highConfidenceVisits === 1 ? '' : 's'}, ${trackedLinkOpens} tracked link fetch${trackedLinkOpens === 1 ? '' : 'es'}, ${signIns} sign-in${signIns === 1 ? '' : 's'}`;
  const lines = [
    'Velvet Dinosaur demo fleet activity summary',
    '',
    `Period: ${formatTime(since)} to ${formatTime(until)}`,
    `Fleet websites covered: ${sites.length}`,
    `Recipient-specific links registered: ${recipients.length}`,
    `Tracked recipient link fetches: ${trackedLinkOpens}`,
    `High-confidence recipient visits: ${highConfidenceVisits}`,
    `Browser-like sources observed: ${browserLikeSources}`,
    `First-party analytics browser sessions: ${sessions.length}`,
    `Successful backend sign-ins: ${signIns}`,
    ''
  ];

  sites.forEach((site, siteIndex) => {
    const siteSessions = sessions.filter((session) => session.site.domain === site.domain);
    const siteSignIns = siteSessions.filter((session) => session.signedIn).length;
    const audit = trafficAudit.find((candidate) => candidate.domain === site.domain);
    const siteRecipients = recipients.filter((recipient) => recipient.siteSlug === site.slug);
    const siteRecipientActivity = recipientActivity.filter(
      (activity) => activity.site.domain === site.domain
    );
    lines.push(`${siteIndex + 1}. ${site.name}`);
    lines.push(`Website: ${site.url}`);
    lines.push(`First-party analytics browser sessions: ${siteSessions.length}`);
    lines.push(`Successful backend sign-ins: ${siteSignIns}`);
    lines.push(`Browser-like sources observed: ${audit?.browserLikeSources || 0}`);
    lines.push(`Excluded/non-qualifying sources: ${audit?.excludedSources || 0}`);
    lines.push(`Known owner/QA sources: ${audit?.ownerOrQaSources || 0}`);
    lines.push(`Explicit automated-agent sources: ${audit?.automatedAgentSources || 0}`);
    lines.push(`Security-probe sources: ${audit?.securityProbeSources || 0}`);
    lines.push(`Backend sign-in attempts: ${audit?.signInAttempts || 0}`);

    if (!siteRecipients.length) {
      lines.push('Recipient tracking: No recipient-specific link has been generated');
    } else {
      for (const recipient of siteRecipients) {
        const activities = siteRecipientActivity.filter(
          (activity) => activity.recipient.id === recipient.id
        );
        lines.push(`Tracked recipient: ${recipient.name} <${recipient.email}>`);
        lines.push(`Tracking link expires: ${formatTime(new Date(recipient.expiresAt))}`);
        if (!activities.length) {
          lines.push('Recipient activity: No tracked-link activity in this period');
          continue;
        }
        for (const activity of activities) {
          lines.push(
            `Tracked activity: ${formatTime(activity.firstSeenAt)} to ${formatTime(activity.lastSeenAt)}`
          );
          lines.push(`Tracked redirect reached: ${activity.linkOpened ? 'Yes' : 'No'}`);
          lines.push(
            `High-confidence human browsing: ${activity.highConfidence ? 'Yes' : 'No'}`
          );
          lines.push(
            `Evidence: ${activity.signals.length ? activity.signals.join(', ') : 'redirect only'}`
          );
          if (activity.pages.length) {
            lines.push('Tracked pages:');
            activity.pages.forEach((page) => lines.push(`- ${page}`));
          }
          lines.push(
            `Invitation page reached: ${activity.pages.some((page) => page === '/sign-up') ? 'Yes' : 'No'}`
          );
          lines.push(`Backend sign-in attempted: ${activity.signInAttempted ? 'Yes' : 'No'}`);
          lines.push(`Successful backend sign-in: ${activity.signedIn ? 'Yes' : 'No'}`);
        }
      }
    }

    if (!siteSessions.length) {
      lines.push('General analytics activity: None; see observed/excluded counts above');
      lines.push('');
      return;
    }

    siteSessions.forEach((session, sessionIndex) => {
      lines.push(
        `Session ${sessionIndex + 1}: ${formatTime(session.firstSeenAt)} to ${formatTime(session.lastSeenAt)}`
      );
      lines.push(`Device: ${session.browser} on ${session.platform}`);
      lines.push('Pages:');
      for (const page of session.pages) lines.push(`- ${page}`);
      lines.push(
        session.signedIn && session.signedInAt
          ? `Successful backend sign-in: Yes, at ${formatTime(session.signedInAt)}`
          : 'Successful backend sign-in: No'
      );
    });
    lines.push('');
  });

  lines.push(
    'Confidence rule: a tracked link fetch alone is not called a human visit. High confidence requires a valid recipient-specific signed link plus at least 10 visible seconds and trusted pointer, keyboard, click or scroll interaction, or a successful sign-in. Ian, server monitoring, QA traffic, exploit probes, known scanners and bot user agents are excluded. First-party analytics sessions are shown separately because browser execution alone cannot prove a person was present.'
  );
  return { subject, body: lines.join('\n') };
}
