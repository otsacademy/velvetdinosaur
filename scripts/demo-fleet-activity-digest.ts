import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync
} from 'node:fs';
import { dirname, join } from 'node:path';

const APPS_ROOT = process.env.VD_APPS_ROOT || '/srv/apps';
const ACCESS_LOG = process.env.VD_ACTIVITY_ACCESS_LOG || '/var/log/nginx/vd-demo-activity.log';
const STATE_FILE = process.env.VD_ACTIVITY_STATE_FILE || '/var/lib/vd-demo-activity-digest/state.json';
const GWS_BINARY =
  process.env.VD_ACTIVITY_GWS_BINARY ||
  '/home/ianw/.gemini/extensions/gws-connector/bin/gws-mcp';
const GWS_ACCOUNT = process.env.VD_ACTIVITY_GWS_ACCOUNT || 'ian-ota';
const RECIPIENT = process.env.VD_ACTIVITY_RECIPIENT || 'iwickens@gmail.com';
const SESSION_GAP_MS = 30 * 60 * 1000;

const DEFAULT_EXCLUDED_IPS = [
  '86.130.124.141', // Ian
  '157.180.5.100', // this server and QA
  '104.28.214.212',
  '104.28.246.211',
  '104.28.246.212',
  '66.249.93.202',
  '66.249.93.203',
  '74.125.208.40',
  '74.125.208.41',
  '23.27.145.144',
  '34.72.176.129',
  '104.197.69.115',
  '34.122.147.229',
  '205.169.39.42',
  '35.185.77.86'
];

const AUTOMATION_PATTERN =
  /(?:\bbot\b|bot\/|crawler|spider|headless|lighthouse|blackbox|monitor|uptime|probe|scanner|scan\/|curl|wget|python|go-http|facebookexternalhit|meta-externalagent|petalbot|bytespider|semrush|ahrefs|mj12|dotbot|bingpreview|claude|gptbot|chatgpt|perplexity|telegrambot|whatsapp|slackbot|discordbot|applebot|google-extended|oai-searchbot|grokbot|twitterbot|linkedinbot|amazonbot|aionbot)/i;

const SECURITY_PROBE_PATH_PATTERN =
  /(?:\.php(?:\/|$)|^\/(?:\.env|\.git|cgi-bin|wp-admin|wp-content|wp-includes|xmlrpc\.php|vendor\/phpunit|server-status|actuator)(?:\/|$)|^\/data\/admin\.json$|^\/(?:adminer|phpinfo)(?:\.php)?$)/i;

export type DemoSite = {
  slug: string;
  name: string;
  domain: string;
  url: string;
};

export type AccessEntry = {
  host: string;
  ip: string;
  occurredAt: Date;
  method: string;
  path: string;
  status: number;
  referer: string;
  userAgent: string;
};

type ActivityEvent = {
  site: DemoSite;
  ip: string;
  userAgent: string;
  occurredAt: Date;
  page: string;
  signedIn: boolean;
};

export type ActivitySession = {
  site: DemoSite;
  visitorKey: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  pages: string[];
  signedIn: boolean;
  signedInAt: Date | null;
  browser: string;
  platform: string;
};

type MonitorState = {
  version: 1;
  lastCheckedAt: string;
};

type JsonRpcResponse = {
  id?: number;
  result?: {
    content?: Array<{ type?: string; text?: string }>;
    isError?: boolean;
  };
  error?: { code?: number; message?: string };
};

function envValue(source: string, key: string) {
  const prefix = `${key}=`;
  const line = source.split(/\r?\n/).find((candidate) => candidate.startsWith(prefix));
  if (!line) return '';
  const raw = line.slice(prefix.length).trim();
  if (raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1);
  if (raw.length >= 2 && raw.startsWith("'") && raw.endsWith("'")) return raw.slice(1, -1);
  return raw;
}

export function discoverDemoSites(appsRoot = APPS_ROOT) {
  if (!existsSync(appsRoot)) return [];

  return readdirSync(appsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !/(?:-blue|-green|-current)$/.test(entry.name))
    .flatMap((entry): DemoSite[] => {
      const envPath = join(appsRoot, entry.name, '.env.production');
      if (!existsSync(envPath)) return [];
      const env = readFileSync(envPath, 'utf8');
      if (envValue(env, 'VD_DEMO_SITE').toLowerCase() !== 'true') return [];

      const domain = envValue(env, 'DOMAIN').toLowerCase();
      if (!domain) return [];
      const slug = envValue(env, 'VD_SITE_SLUG') || entry.name;
      const name =
        envValue(env, 'VD_SITE_NAME') ||
        envValue(env, 'NEXT_PUBLIC_VD_SITE_NAME') ||
        envValue(env, 'NEXT_PUBLIC_SITE_NAME') ||
        slug;

      return [{ slug, name, domain, url: `https://${domain}/` }];
    })
    .sort((left, right) => left.slug.localeCompare(right.slug));
}

function parseNginxDate(value: string, offset: string) {
  const match = value.match(/^(\d{2})\/([A-Z][a-z]{2})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const months: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11
  };
  const month = months[match[2]];
  if (month === undefined) return null;
  const sign = offset.startsWith('-') ? -1 : 1;
  const offsetMinutes = sign * (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(3, 5)));
  const utc =
    Date.UTC(
      Number(match[3]),
      month,
      Number(match[1]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6])
    ) -
    offsetMinutes * 60 * 1000;
  return new Date(utc);
}

export function parseAccessLine(line: string): AccessEntry | null {
  if (line.startsWith('{')) {
    try {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      const occurredAt = new Date(String(parsed.time || ''));
      const status = Number(parsed.status);
      if (!Number.isFinite(occurredAt.getTime()) || !Number.isFinite(status)) return null;
      return {
        host: String(parsed.host || '').toLowerCase(),
        ip: String(parsed.ip || ''),
        occurredAt,
        method: String(parsed.method || ''),
        path: String(parsed.uri || ''),
        status,
        referer: String(parsed.referer || ''),
        userAgent: String(parsed.userAgent || '')
      };
    } catch {
      return null;
    }
  }

  const match = line.match(
    /^(\S+) \S+ \S+ \[([^ ]+) ([+-]\d{4})\] "(\S+) ([^ ]+) [^"]+" (\d{3}) \S+ "([^"]*)" "([^"]*)"/
  );
  if (!match) return null;
  const occurredAt = parseNginxDate(match[2], match[3]);
  if (!occurredAt) return null;

  return {
    host: '',
    ip: match[1],
    occurredAt,
    method: match[4],
    path: match[5],
    status: Number(match[6]),
    referer: match[7],
    userAgent: match[8]
  };
}

export function isAutomatedUserAgent(userAgent: string) {
  return !userAgent || userAgent === '-' || AUTOMATION_PATTERN.test(userAgent);
}

function excludedIps() {
  const extra = (process.env.VD_ACTIVITY_EXCLUDED_IPS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_EXCLUDED_IPS, ...extra]);
}

function identifyBrowser(userAgent: string) {
  if (/Edg\//.test(userAgent)) return 'Microsoft Edge';
  if (/Firefox\//.test(userAgent)) return 'Firefox';
  if (/Chrome\//.test(userAgent)) return 'Chrome';
  if (/Safari\//.test(userAgent)) return 'Safari';
  return 'Browser';
}

function identifyPlatform(userAgent: string) {
  if (/iPhone|iPad/.test(userAgent)) return 'iOS';
  if (/Android/.test(userAgent)) return 'Android';
  if (/Windows/.test(userAgent)) return 'Windows';
  if (/Macintosh|Mac OS X/.test(userAgent)) return 'macOS';
  if (/Linux|X11/.test(userAgent)) return 'Linux';
  return 'Unknown platform';
}

function visitorFingerprint(ip: string, userAgent: string) {
  return new Bun.CryptoHasher('sha256').update(`${ip}|${userAgent}`).digest('hex').slice(0, 16);
}

function safePageFromReferer(referer: string, expectedDomain: string) {
  try {
    const url = new URL(referer);
    if (url.hostname.toLowerCase() !== expectedDomain) return '';
    return url.pathname || '/';
  } catch {
    return '';
  }
}

export function isLikelyPagePath(path: string) {
  if (!path.startsWith('/')) return false;
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/api/') ||
    path.startsWith('/.') ||
    path === '/robots.txt' ||
    path === '/sitemap.xml' ||
    path === '/favicon.ico' ||
    path === '/manifest.webmanifest'
  ) {
    return false;
  }
  return !/\.(?:avif|bmp|css|csv|gif|ico|jpe?g|js|json|map|mp3|mp4|pdf|php|png|svg|txt|webm|webp|woff2?|xml)$/i.test(
    path
  );
}

export function isSecurityProbePath(path: string) {
  return SECURITY_PROBE_PATH_PATTERN.test(path.split(/[?#]/, 1)[0]);
}

function eventFromEntry(
  entry: AccessEntry,
  siteByDomain: Map<string, DemoSite>,
  ignoredIps: Set<string>
): ActivityEvent | null {
  if (ignoredIps.has(entry.ip) || isAutomatedUserAgent(entry.userAgent)) return null;
  if (entry.status < 200 || entry.status >= 300) return null;

  let refererHost = '';
  try {
    refererHost = new URL(entry.referer).hostname.toLowerCase();
  } catch {}
  const site = siteByDomain.get(entry.host) || siteByDomain.get(refererHost);
  if (!site) return null;

  const directPageRequest =
    entry.method === 'GET' && entry.status < 400 && isLikelyPagePath(entry.path);
  const analyticsRequest =
    entry.method === 'POST' &&
    (entry.path === '/api/analytics' || entry.path === '/api/vd-telemetry');
  const successfulSignIn =
    entry.method === 'POST' && entry.path.startsWith('/api/auth/sign-in/') && entry.status < 300;
  // Analytics confirms a browser session; document requests provide its page list.
  // Successful sign-ins remain reportable even if page-view analytics is absent.
  if (!directPageRequest && !successfulSignIn && !analyticsRequest) return null;

  const page = directPageRequest
    ? entry.path
    : safePageFromReferer(entry.referer, site.domain) || (successfulSignIn ? '/sign-in' : '');
  if (!page) return null;
  return {
    site,
    ip: entry.ip,
    userAgent: entry.userAgent,
    occurredAt: entry.occurredAt,
    page,
    signedIn: successfulSignIn
  };
}

export function collectActivitySessions(
  lines: string[],
  sites: DemoSite[],
  since: Date,
  until: Date,
  ignoredIps = excludedIps()
) {
  const siteByDomain = new Map(sites.map((site) => [site.domain, site]));
  const entries = lines
    .map(parseAccessLine)
    .filter((entry): entry is AccessEntry => Boolean(entry))
    .filter(
      (entry) => entry.occurredAt.getTime() > since.getTime() && entry.occurredAt.getTime() <= until.getTime()
    );
  // A scanner can impersonate Chrome and request a real page before probing
  // exploit paths. Reject the whole source/site window, not only the bad paths.
  const addressKey = (entry: AccessEntry) => `${entry.host}|${entry.ip}`;
  const sourceKey = (entry: AccessEntry) => `${addressKey(entry)}|${entry.userAgent}`;
  const probeSources = new Set(
    entries
      .filter((entry) => isSecurityProbePath(entry.path))
      .map(addressKey)
  );
  const confirmedSources = new Set(
    entries
      .filter(
        (entry) =>
          entry.status >= 200 &&
          entry.status < 300 &&
          ((entry.method === 'POST' &&
            (entry.path === '/api/analytics' || entry.path === '/api/vd-telemetry')) ||
            (entry.method === 'POST' && entry.path.startsWith('/api/auth/sign-in/')))
      )
      .map(sourceKey)
  );
  const events = entries
    .filter((entry) => !probeSources.has(addressKey(entry)) && confirmedSources.has(sourceKey(entry)))
    .map((entry) => eventFromEntry(entry, siteByDomain, ignoredIps))
    .filter((event): event is ActivityEvent => Boolean(event))
    .sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime());

  const sessions: Array<ActivitySession & { pageSet: Set<string>; sourceKey: string }> = [];
  const latestBySource = new Map<string, (typeof sessions)[number]>();

  for (const event of events) {
    const visitorKey = visitorFingerprint(event.ip, event.userAgent);
    const sourceKey = `${event.site.domain}|${visitorKey}`;
    let session = latestBySource.get(sourceKey);
    if (!session || event.occurredAt.getTime() - session.lastSeenAt.getTime() > SESSION_GAP_MS) {
      session = {
        site: event.site,
        visitorKey,
        sourceKey,
        firstSeenAt: event.occurredAt,
        lastSeenAt: event.occurredAt,
        pages: [],
        pageSet: new Set<string>(),
        signedIn: false,
        signedInAt: null,
        browser: identifyBrowser(event.userAgent),
        platform: identifyPlatform(event.userAgent)
      };
      sessions.push(session);
      latestBySource.set(sourceKey, session);
    }

    session.lastSeenAt = event.occurredAt;
    if (!session.pageSet.has(event.page)) {
      session.pageSet.add(event.page);
      session.pages.push(event.page);
    }
    if (event.signedIn) {
      session.signedIn = true;
      session.signedInAt = event.occurredAt;
    }
  }

  return sessions.map(({ pageSet: _pageSet, sourceKey: _sourceKey, ...session }) => session);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

export function formatDigest(sessions: ActivitySession[], since: Date, until: Date) {
  const signIns = sessions.filter((session) => session.signedIn).length;
  const subject = `[Velvet Dinosaur] Demo activity: ${sessions.length} visitor session${sessions.length === 1 ? '' : 's'}, ${signIns} sign-in${signIns === 1 ? '' : 's'}`;
  const lines = [
    'Velvet Dinosaur demo fleet activity summary',
    '',
    `Period: ${formatTime(since)} to ${formatTime(until)}`,
    `Likely human visitor sessions: ${sessions.length}`,
    `Successful backend sign-ins: ${signIns}`,
    ''
  ];

  sessions.forEach((session, index) => {
    lines.push(`${index + 1}. ${session.site.name}`);
    lines.push(`Website: ${session.site.url}`);
    lines.push(`Visit: ${formatTime(session.firstSeenAt)} to ${formatTime(session.lastSeenAt)}`);
    lines.push(`Device: ${session.browser} on ${session.platform}`);
    lines.push('Pages:');
    for (const page of session.pages) lines.push(`- ${page}`);
    lines.push(
      session.signedIn && session.signedInAt
        ? `Successful backend sign-in: Yes, at ${formatTime(session.signedInAt)}`
        : 'Successful backend sign-in: No'
    );
    lines.push('');
  });

  lines.push(
    'Filtering: only first-party analytics-confirmed visits and successful sign-ins are reported. Ian, server monitoring, QA traffic, exploit probes, known scanners, bot user agents and duplicate requests are excluded. Pages are deduplicated within each 30-minute visitor session.'
  );
  return { subject, body: lines.join('\n') };
}

function readState() {
  if (!existsSync(STATE_FILE)) return null;
  try {
    const parsed = JSON.parse(readFileSync(STATE_FILE, 'utf8')) as MonitorState;
    if (parsed.version !== 1 || !Number.isFinite(Date.parse(parsed.lastCheckedAt))) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState(lastCheckedAt: Date) {
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  const temporary = `${STATE_FILE}.tmp`;
  writeFileSync(
    temporary,
    `${JSON.stringify({ version: 1, lastCheckedAt: lastCheckedAt.toISOString() }, null, 2)}\n`,
    { mode: 0o600 }
  );
  renameSync(temporary, STATE_FILE);
}

function readAccessLines() {
  const previous = `${ACCESS_LOG}.1`;
  const paths = [previous, ACCESS_LOG].filter(existsSync);
  return paths.flatMap((path) => readFileSync(path, 'utf8').split(/\r?\n/));
}

async function sendGwsEmail(subject: string, body: string) {
  const process = Bun.spawn([GWS_BINARY, '--use-dot-names'], {
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...Bun.env, HOME: Bun.env.HOME || '/home/ianw' }
  });
  const pending = new Map<number, (response: JsonRpcResponse) => void>();
  let sequence = 0;
  let buffer = '';

  const pump = (async () => {
    const reader = process.stdout.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf('\n');
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) {
          const response = JSON.parse(line) as JsonRpcResponse;
          if (response.id && pending.has(response.id)) {
            pending.get(response.id)?.(response);
            pending.delete(response.id);
          }
        }
        newline = buffer.indexOf('\n');
      }
    }
  })();

  function write(message: object) {
    process.stdin.write(`${JSON.stringify(message)}\n`);
  }

  async function call(method: string, params: object) {
    const id = ++sequence;
    const response = await new Promise<JsonRpcResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`GWS ${method} timed out`));
      }, 30_000);
      pending.set(id, (value) => {
        clearTimeout(timer);
        resolve(value);
      });
      write({ jsonrpc: '2.0', id, method, params });
    });
    if (response.error) throw new Error(response.error.message || `GWS ${method} failed`);
    const text = response.result?.content?.map((item) => item.text || '').join('\n') || '';
    if (response.result?.isError) throw new Error(text || `GWS ${method} failed`);
    return text;
  }

  try {
    await call('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'vd-demo-activity-digest', version: '1.0.0' }
    });
    write({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
    const created = await call('tools/call', {
      name: 'gws.mail.create_draft',
      arguments: { account: GWS_ACCOUNT, to: RECIPIENT, subject, body }
    });
    const draftId = created.match(/Draft ID:\s*(\S+)/)?.[1];
    if (!draftId) throw new Error(`GWS did not return a draft ID: ${created}`);
    const sent = await call('tools/call', {
      name: 'gws.mail.send_draft',
      arguments: { account: GWS_ACCOUNT, draftId }
    });
    if (!/Email sent from/.test(sent)) throw new Error(`GWS did not confirm delivery: ${sent}`);
    return sent;
  } finally {
    process.stdin.end();
    await Promise.race([pump, Bun.sleep(1000)]).catch(() => {});
    if (process.exitCode === null) process.kill();
  }
}

function argumentValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length) || '';
}

async function main() {
  const initialize = process.argv.includes('--initialize');
  const dryRun = process.argv.includes('--dry-run');
  const until = new Date(argumentValue('until') || Date.now());
  if (!Number.isFinite(until.getTime())) throw new Error('Invalid --until timestamp.');

  const state = readState();
  const explicitSince = argumentValue('since');
  if (initialize || (!state && !explicitSince)) {
    saveState(until);
    console.log(`Demo activity digest initialized at ${until.toISOString()}; no historic email sent.`);
    return;
  }

  const since = new Date(explicitSince || state?.lastCheckedAt || until.toISOString());
  if (!Number.isFinite(since.getTime()) || since.getTime() > until.getTime()) {
    throw new Error('Invalid activity digest time window.');
  }

  const sites = discoverDemoSites();
  if (!sites.length) throw new Error('No demo sites discovered; refusing to advance the checkpoint.');
  const sessions = collectActivitySessions(readAccessLines(), sites, since, until);
  const digest = formatDigest(sessions, since, until);

  if (dryRun) {
    console.log(`${digest.subject}\n\n${digest.body}`);
    return;
  }

  if (sessions.length) {
    const confirmation = await sendGwsEmail(digest.subject, digest.body);
    console.log(`${digest.subject}; ${confirmation.replace(/\s+/g, ' ')}`);
  } else {
    console.log(`No qualifying demo activity from ${since.toISOString()} to ${until.toISOString()}.`);
  }
  saveState(until);
}

if (import.meta.main) {
  await main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
  });
}
