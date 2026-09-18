import { describe, expect, test } from 'bun:test';
import { assertNewsletterStorageEnvironment, invokeNewsletterCron, newsletterCronUrl, requireEmptyNewsletterQueue, type NewsletterCronSummary } from './operations';

describe('newsletter operational safeguards', () => {
  test('maintenance requires the selected site to configure its own database and storage', () => {
    const env = { MONGODB_URI: 'mongodb://localhost/test', R2_ENDPOINT: 'https://storage.invalid',
      R2_ACCESS_KEY_ID: 'test-key', R2_SECRET_ACCESS_KEY: 'test-secret' };
    expect(() => assertNewsletterStorageEnvironment(env)).not.toThrow();
    for (const key of Object.keys(env)) {
      expect(() => assertNewsletterStorageEnvironment({ ...env, [key]: '' })).toThrow(key);
    }
  });
  test('uses stable HTTPS origin, never a slot or localhost endpoint', () => {
    expect(newsletterCronUrl({ DOMAIN: 'example.com' }).href).toBe('https://example.com/api/internal/newsletter-dispatch-cron');
    for (const origin of ['http://example.com', 'https://example.com:3103', 'https://localhost', 'https://u:p@example.com']) {
      expect(() => newsletterCronUrl({ PUBLIC_BASE_URL: origin })).toThrow();
    }
  });
  test('activation rejects backlog, uncertain delivery and incomplete dry-run responses', () => {
    const empty: NewsletterCronSummary = { dryRun: true, dueCampaigns: 0, pendingDeliveries: 0,
      processingDeliveries: 0, needsReviewDeliveries: 0, queuedCampaigns: 0, sendingCampaigns: 0 };
    expect(() => requireEmptyNewsletterQueue(empty)).not.toThrow();
    for (const field of ['dueCampaigns', 'pendingDeliveries', 'processingDeliveries', 'needsReviewDeliveries', 'queuedCampaigns', 'sendingCampaigns']) {
      expect(() => requireEmptyNewsletterQueue({ ...empty, [field]: 1 })).toThrow();
    }
    expect(() => requireEmptyNewsletterQueue({ dryRun: true } as NewsletterCronSummary)).toThrow();
  });
  test('sends an explicit dry run and refuses redirects/unconfirmed dry-run responses', async () => {
    let captured: RequestInit | undefined;
    const request = (async (_input: unknown, init?: RequestInit) => {
      captured = init;
      return Response.json({ dryRun: true });
    }) as unknown as typeof fetch;
    await invokeNewsletterCron({ DOMAIN: 'example.com', CRON_SECRET: 'test-secret' }, true, request);
    expect(captured?.redirect).toBe('error');
    expect(captured?.body).toBe('{"dryRun":true}');
    const oldEndpoint = (async () => Response.json({ sent: 0 })) as unknown as typeof fetch;
    await expect(invokeNewsletterCron({ DOMAIN: 'example.com', CRON_SECRET: 'test-secret' }, true, oldEndpoint)).rejects.toThrow('confirm');
  });
});
