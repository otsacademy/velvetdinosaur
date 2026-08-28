export type DigestSite = {
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
  since: Date,
  until: Date
) {
  const signIns = sessions.filter((session) => session.signedIn).length;
  const subject = `[Velvet Dinosaur] ${sites.length}-demo activity: ${sessions.length} visitor session${sessions.length === 1 ? '' : 's'}, ${signIns} sign-in${signIns === 1 ? '' : 's'}`;
  const lines = [
    'Velvet Dinosaur demo fleet activity summary',
    '',
    `Period: ${formatTime(since)} to ${formatTime(until)}`,
    `Fleet websites covered: ${sites.length}`,
    `Likely human visitor sessions: ${sessions.length}`,
    `Successful backend sign-ins: ${signIns}`,
    ''
  ];

  sites.forEach((site, siteIndex) => {
    const siteSessions = sessions.filter((session) => session.site.domain === site.domain);
    const siteSignIns = siteSessions.filter((session) => session.signedIn).length;
    lines.push(`${siteIndex + 1}. ${site.name}`);
    lines.push(`Website: ${site.url}`);
    lines.push(`Visitor sessions: ${siteSessions.length}`);
    lines.push(`Successful backend sign-ins: ${siteSignIns}`);

    if (!siteSessions.length) {
      lines.push('Activity: No qualifying activity');
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
    'Filtering: only first-party analytics-confirmed visits and successful sign-ins are reported. Ian, server monitoring, QA traffic, exploit probes, known scanners, bot user agents and duplicate requests are excluded. Pages are deduplicated within each 30-minute visitor session.'
  );
  return { subject, body: lines.join('\n') };
}
