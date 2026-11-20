import { requireNewsletterDatabase } from '@/lib/newsletter/database';
import { CspReportCount } from '@/models/CspReportCount';

// Browsers send a report here (report-uri in lib/security-headers.ts) when the report-only policy would have
// blocked something. Only the directive and the blocked source's scheme and host are counted, per day. The page,
// the visitor's address, the browser and full addresses are never stored.
export const CSP_REPORT_MAX_BYTES = 16 * 1024;
const KEYS_PER_DAY = 300; // distinct (directive, source) pairs counted per day; more are dropped
const KEEP_DAYS = 90;

const DIRECTIVES = new Set([
  'default-src', 'script-src', 'script-src-elem', 'script-src-attr', 'style-src', 'style-src-elem', 'style-src-attr',
  'img-src', 'font-src', 'connect-src', 'media-src', 'object-src', 'frame-src', 'child-src', 'worker-src',
  'manifest-src', 'form-action', 'base-uri', 'frame-ancestors', 'fenced-frame-src', 'require-trusted-types-for',
  'trusted-types'
]);
// Browsers name some blocked sources with a word instead of an address (data: and blob: often as just "data", "blob").
const KEYWORDS = new Set(['inline', 'eval', 'wasm-eval', 'self', 'data', 'blob', 'filesystem', 'mediastream', 'trusted-types-policy', 'trusted-types-sink']);

export type CspReportSummary = { directive: string; blocked: string };

function field(report: Record<string, unknown>, ...names: string[]) {
  for (const name of names) {
    if (typeof report[name] === 'string') return (report[name] as string).trim();
  }
  return '';
}

function blockedSource(value: string) {
  const text = value.toLowerCase();
  if (!text) return 'none';
  if (KEYWORDS.has(text)) return text;
  const scheme = /^([a-z][a-z0-9+.-]*):/.exec(text)?.[1];
  if (!scheme) return 'other';
  if (scheme.endsWith('-extension')) return 'extension';
  if (!['http', 'https', 'ws', 'wss'].includes(scheme)) return scheme.slice(0, 20);
  try {
    const url = new URL(text);
    return url.host && url.host.length <= 200 ? `${url.protocol}//${url.host}` : 'other';
  } catch {
    return 'other';
  }
}

// Accepts the report-uri format ({"csp-report": {...}}) and the Reporting API's ([{type: "csp-violation", body}]).
export function summarizeCspReport(raw: string): CspReportSummary | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const entry = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!entry || typeof entry !== 'object') return null;
  const outer = entry as Record<string, unknown>;
  const report = (outer['csp-report'] ?? outer.body) as Record<string, unknown> | undefined;
  if (!report || typeof report !== 'object') return null;
  const directive = field(report, 'effective-directive', 'effectiveDirective', 'violated-directive').split(/\s+/)[0].toLowerCase();
  if (!DIRECTIVES.has(directive)) return null;
  return { directive, blocked: blockedSource(field(report, 'blocked-uri', 'blockedURL')) };
}

export async function recordCspReport(summary: CspReportSummary, now = new Date()) {
  await requireNewsletterDatabase();
  const day = now.toISOString().slice(0, 10);
  const key = { day, directive: summary.directive, blocked: summary.blocked };
  const existing = await CspReportCount.updateOne(key, { $inc: { count: 1 } });
  if (existing.matchedCount > 0) return true;
  if ((await CspReportCount.countDocuments({ day })) >= KEYS_PER_DAY) return false;
  const expiresAt = new Date(now.getTime() + KEEP_DAYS * 24 * 60 * 60 * 1000);
  await CspReportCount.updateOne(key, { $inc: { count: 1 }, $setOnInsert: { expiresAt } }, { upsert: true });
  return true;
}
