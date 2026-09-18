import { readFile } from 'node:fs/promises';

// Keep operational configuration out of command lines and log output.
export async function readNewsletterEnvironment(file: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const line of (await readFile(file, 'utf8')).split(/\r?\n/)) {
    const match = line.trim().match(/^(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[match[1]] = value;
  }
  return result;
}

export function newsletterCronUrl(env: Record<string, string | undefined>): URL {
  const origin = env.PUBLIC_BASE_URL || env.NEXT_PUBLIC_BASE_URL || env.APP_BASE_URL ||
    (env.DOMAIN ? `https://${env.DOMAIN}` : '');
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]') {
    throw new Error('Newsletter scheduling requires a stable public HTTPS origin without credentials or a slot port.');
  }
  return new URL('/api/internal/newsletter-dispatch-cron', url.origin);
}

export type NewsletterCronSummary = {
  dryRun: boolean;
  dueCampaigns: number;
  pendingDeliveries: number;
  processingDeliveries: number;
  needsReviewDeliveries: number;
  queuedCampaigns: number;
  sendingCampaigns: number;
  [key: string]: unknown;
};

export function requireEmptyNewsletterQueue(summary: NewsletterCronSummary) {
  const fields = ['dueCampaigns', 'pendingDeliveries', 'processingDeliveries', 'needsReviewDeliveries',
    'queuedCampaigns', 'sendingCampaigns'] as const;
  if (summary.dryRun !== true || fields.some((field) => !Number.isInteger(summary[field]) || summary[field] !== 0)) {
    throw new Error('Scheduler activation requires a verified empty queue. Review queued, sending and uncertain deliveries first.');
  }
}

export async function invokeNewsletterCron(
  env: Record<string, string | undefined>,
  dryRun: boolean,
  request: typeof fetch = fetch
): Promise<NewsletterCronSummary> {
  if (!env.CRON_SECRET?.trim()) throw new Error('CRON_SECRET is not configured.');
  const response = await request(newsletterCronUrl(env), {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(55_000),
    headers: { 'content-type': 'application/json', 'x-cron-secret': env.CRON_SECRET.trim() },
    body: JSON.stringify({ dryRun })
  });
  if (!response.ok) throw new Error(`Newsletter scheduler returned HTTP ${response.status}.`);
  const summary = await response.json() as NewsletterCronSummary;
  if (dryRun && summary.dryRun !== true) throw new Error('Endpoint did not confirm a read-only dry-run; scheduler remains disabled.');
  return summary;
}
