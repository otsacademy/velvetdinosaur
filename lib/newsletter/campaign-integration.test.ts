import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { NewsletterCampaign } from '@/models/NewsletterCampaign';
import { NewsletterDelivery } from '@/models/NewsletterDelivery';
import { NewsletterPreference } from '@/models/NewsletterPreference';
import { NewsletterMedia } from '@/models/NewsletterMedia';
import * as sender from '@/lib/email/newsletter-campaign';
import * as preparation from './campaign-preparation';
import { createNewsletterCampaignDraft, queueNewsletterCampaign, updateNewsletterCampaignDraft, unscheduleNewsletterCampaign, cancelNewsletterCampaign, dispatchQueuedNewsletterCampaigns } from './campaigns';
import type { CampaignDoc } from './campaign-types';
import { POST as cronPost } from '@/app/api/internal/newsletter-dispatch-cron/route';

// Run explicitly: NEWSLETTER_MONGO_INTEGRATION=1 bun test lib/newsletter/campaign-integration.test.ts
// Every operation is restricted to a freshly generated database; only connection/auth
// settings are inherited from NEWSLETTER_TEST_MONGO_URI. Its database is never used.
const run = process.env.NEWSLETTER_MONGO_INTEGRATION === '1';
const testDb = `codex_newsletter_test_${randomUUID().replaceAll('-', '')}`;
const previousEnv = { ...process.env };
let initialized = false;
const input = { name: 'Integration', subject: 'Test subject', htmlBody: '<p>Original content</p>', textBody: 'Original content', createdByUserId: 'editor', bodySource: 'html' as const };
const findCampaign = async (id: string) => await NewsletterCampaign.findById(id).lean() as CampaignDoc | null;
const deliveryModel = NewsletterDelivery as unknown as { updateOne: (filter: Record<string, unknown>, update: Record<string, unknown>) => Promise<{ matchedCount: number }> };

describe.skipIf(!run)('newsletter real Mongo lifecycle and concurrency (isolated database)', () => {
  beforeAll(async () => {
    if (!process.env.NEWSLETTER_TEST_MONGO_URI) throw new Error('Set NEWSLETTER_TEST_MONGO_URI to a server permitting isolated test databases.');
    const uri = new URL(process.env.NEWSLETTER_TEST_MONGO_URI);
    if (uri.username && !uri.searchParams.has('authSource')) uri.searchParams.set('authSource', uri.pathname.slice(1) || 'admin');
    uri.pathname = `/${testDb}`;
    process.env.MONGODB_URI = uri.href;
    process.env.POSTMARK_SERVER_TOKEN = 'mock-no-network';
    process.env.POSTMARK_FROM_EMAIL = 'sender@example.test';
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.test';
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = 'local-integration-secret';
    process.env.CRON_SECRET = 'local-cron-secret';
    process.env.VD_DEMO_SITE = 'false';
    for (const network of ['FACEBOOK', 'INSTAGRAM', 'X', 'BLUESKY', 'LINKEDIN']) delete process.env[`NEWSLETTER_SOCIAL_${network}_URL`];
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 2000, bufferCommands: false });
    if (mongoose.connection.name !== testDb) throw new Error('Integration database isolation failed.');
    await Promise.all([NewsletterCampaign.init(), NewsletterDelivery.init(), NewsletterPreference.init(), NewsletterMedia.init()]);
    initialized = true;
  });
  beforeEach(async () => {
    if (mongoose.connection.name !== testDb) throw new Error('Refusing mutation outside isolated integration database.');
    for (const collection of await mongoose.connection.db!.collections()) await collection.deleteMany({});
    await NewsletterPreference.insertMany([
      { userId: 'alice', email: 'alice@example.test', firstName: 'Alice', status: 'subscribed' },
      { userId: 'bob', email: 'bob@example.test', firstName: 'Bob', status: 'subscribed' }
    ]);
  });
  afterEach(() => { mock.restore(); process.env.POSTMARK_SERVER_TOKEN = 'mock-no-network'; });
  afterAll(async () => {
    if (initialized && mongoose.connection.name === testDb && /^codex_newsletter_test_[a-f0-9]{32}$/.test(testDb)) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    for (const key of Object.keys(process.env)) if (!(key in previousEnv)) delete process.env[key];
    Object.assign(process.env, previousEnv);
  });

  async function queuedCampaign() {
    const draft = await createNewsletterCampaignDraft(input);
    return (await queueNewsletterCampaign({ campaignId: draft.id }))!;
  }

  test('concurrent queue calls produce one frozen campaign and one recipient snapshot', async () => {
    const draft = await createNewsletterCampaignDraft(input);
    const results = await Promise.allSettled([queueNewsletterCampaign({ campaignId: draft.id }), queueNewsletterCampaign({ campaignId: draft.id })]);
    expect(results.filter((result) => result.status === 'fulfilled').length).toBe(1);
    expect(await NewsletterDelivery.countDocuments({ campaignId: draft.id })).toBe(2);
    const saved = await findCampaign(draft.id);
    expect(saved?.status).toBe('queued');
    expect(saved?.frozenContent?.htmlBody).toContain('Original content');
    expect(saved?.preparationToken).toBeNull();
  });

  test('queued edits are refused until unschedule; a new queue freezes updated content', async () => {
    const queued = await queuedCampaign();
    expect(await updateNewsletterCampaignDraft({ ...input, campaignId: queued.id, htmlBody: '<p>Changed</p>' })).toBeNull();
    expect((await unscheduleNewsletterCampaign(queued.id))?.status).toBe('draft');
    expect(await NewsletterDelivery.countDocuments({ campaignId: queued.id })).toBe(0);
    await updateNewsletterCampaignDraft({ ...input, campaignId: queued.id, htmlBody: '<p>Changed</p>' });
    await queueNewsletterCampaign({ campaignId: queued.id });
    expect((await findCampaign(queued.id))?.frozenContent?.htmlBody).toContain('Changed');
  });

  test('overlapping real dispatches use atomic claims and submit each recipient once', async () => {
    const queued = await queuedCampaign();
    const sent: string[] = [];
    spyOn(sender, 'sendNewsletterCampaignEmail').mockImplementation(async (message) => {
      sent.push(message.to);
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { ok: true, messageId: `mock-${sent.length}`, error: '' };
    });
    await Promise.all([dispatchQueuedNewsletterCampaigns(), dispatchQueuedNewsletterCampaigns()]);
    expect(sent.sort()).toEqual(['alice@example.test', 'bob@example.test']);
    expect(await NewsletterDelivery.countDocuments({ campaignId: queued.id, status: 'sent' })).toBe(2);
    expect((await findCampaign(queued.id))?.status).toBe('completed');
    await dispatchQueuedNewsletterCampaigns();
    expect(sent.length).toBe(2);
  });

  test('a snapshotted due campaign requeued for the future is not claimed or sent', async () => {
    const now = new Date();
    const first = await createNewsletterCampaignDraft(input);
    const second = await createNewsletterCampaignDraft(input);
    await queueNewsletterCampaign({ campaignId: first.id, scheduledAt: new Date(now.getTime() - 120_000) });
    await queueNewsletterCampaign({ campaignId: second.id, scheduledAt: new Date(now.getTime() - 60_000) });
    const future = new Date(now.getTime() + 24 * 60 * 60_000);
    let rescheduled = false;
    const sentCampaigns: string[] = [];
    spyOn(sender, 'sendNewsletterCampaignEmail').mockImplementation(async (message) => {
      sentCampaigns.push(message.campaignId!);
      if (!rescheduled) {
        rescheduled = true;
        expect((await unscheduleNewsletterCampaign(second.id))?.status).toBe('draft');
        await queueNewsletterCampaign({ campaignId: second.id, scheduledAt: future });
      }
      return { ok: true, messageId: `mock-${sentCampaigns.length}`, error: '' };
    });
    await dispatchQueuedNewsletterCampaigns({ now });
    expect(sentCampaigns).toEqual([first.id, first.id]);
    const saved = await findCampaign(second.id);
    expect(saved?.status).toBe('queued');
    expect(saved?.scheduledAt).toEqual(future);
    expect(saved?.dispatchLeaseToken).toBeNull();
    expect(saved?.startedAt).toBeNull();
    expect(await NewsletterDelivery.countDocuments({ campaignId: second.id, status: 'pending' })).toBe(2);
    expect(await NewsletterDelivery.countDocuments({ campaignId: second.id, attempts: { $gt: 0 } })).toBe(0);
  });

  test('legacy campaigns with a null schedule remain immediately dispatchable', async () => {
    const queued = await queuedCampaign();
    await NewsletterCampaign.updateOne({ _id: queued.id }, { $set: { scheduledAt: null, queuedAt: null } });
    const send = spyOn(sender, 'sendNewsletterCampaignEmail').mockResolvedValue({ ok: true, messageId: 'accepted', error: '' });
    await dispatchQueuedNewsletterCampaigns();
    expect(send).toHaveBeenCalledTimes(2);
    expect((await findCampaign(queued.id))?.status).toBe('completed');
  });

  test('ambiguous provider response pauses the campaign and never retries the recipient', async () => {
    const queued = await queuedCampaign();
    const send = spyOn(sender, 'sendNewsletterCampaignEmail').mockResolvedValue({ ok: false, messageId: '', error: 'connection lost', ambiguous: true });
    await dispatchQueuedNewsletterCampaigns();
    expect(await NewsletterDelivery.countDocuments({ campaignId: queued.id, status: 'needs_review' })).toBe(1);
    expect(await NewsletterDelivery.countDocuments({ campaignId: queued.id, status: 'pending' })).toBe(1);
    await dispatchQueuedNewsletterCampaigns();
    expect(send).toHaveBeenCalledTimes(1);
    expect((await findCampaign(queued.id))?.needsReviewCount).toBe(1);
  });

  test('provider acceptance followed by acknowledgement failure becomes needs_review', async () => {
    const queued = await queuedCampaign();
    const update = NewsletterDelivery.updateOne.bind(NewsletterDelivery);
    spyOn(deliveryModel, 'updateOne').mockImplementation(async (filter, mutation) => {
      if ((mutation.$set as { status?: string })?.status === 'sent') throw new Error('Simulated database acknowledgement failure');
      return update(filter, mutation);
    });
    const send = spyOn(sender, 'sendNewsletterCampaignEmail').mockResolvedValue({ ok: true, messageId: 'accepted', error: '' });
    await dispatchQueuedNewsletterCampaigns();
    expect(await NewsletterDelivery.countDocuments({ campaignId: queued.id, status: 'needs_review' })).toBe(1);
    await dispatchQueuedNewsletterCampaigns();
    expect(send).toHaveBeenCalledTimes(1);
  });

  test('stale processing claim is reviewed after worker death, never automatically resent', async () => {
    const queued = await queuedCampaign();
    const old = new Date(Date.now() - 61 * 60_000);
    await NewsletterDelivery.findOneAndUpdate({ campaignId: queued.id }, { $set: { status: 'processing', claimToken: 'dead-worker', claimedAt: old } });
    await NewsletterCampaign.updateOne({ _id: queued.id }, { $set: { status: 'sending', dispatchLeaseToken: 'dead-worker', dispatchLeaseUntil: old } });
    const send = spyOn(sender, 'sendNewsletterCampaignEmail').mockResolvedValue({ ok: true, messageId: 'never', error: '' });
    await dispatchQueuedNewsletterCampaigns();
    expect(send).not.toHaveBeenCalled();
    expect(await NewsletterDelivery.countDocuments({ campaignId: queued.id, status: 'needs_review' })).toBe(1);
  });

  test('cancellation during in-flight provider request stops the next recipient and preserves counters', async () => {
    const queued = await queuedCampaign();
    const send = spyOn(sender, 'sendNewsletterCampaignEmail').mockImplementation(async () => {
      await cancelNewsletterCampaign(queued.id);
      return { ok: true, messageId: 'already-accepted', error: '' };
    });
    await dispatchQueuedNewsletterCampaigns();
    expect(send).toHaveBeenCalledTimes(1);
    const campaign = await findCampaign(queued.id);
    expect(campaign?.status).toBe('cancelled');
    expect(campaign?.sentCount).toBe(1);
  });

  test('cancelling a legacy campaign during freezing never publishes or submits the frozen version', async () => {
    const queued = await queuedCampaign();
    await NewsletterCampaign.updateOne({ _id: queued.id }, { $set: { frozenContent: null } });
    const freeze = preparation.freezeNewsletterCampaign;
    spyOn(preparation, 'freezeNewsletterCampaign').mockImplementation(async (campaign, campaignId) => {
      const content = await freeze(campaign, campaignId);
      await cancelNewsletterCampaign(campaignId);
      return content;
    });
    const send = spyOn(sender, 'sendNewsletterCampaignEmail').mockResolvedValue({ ok: true, messageId: 'never', error: '' });
    await dispatchQueuedNewsletterCampaigns();
    const campaign = await findCampaign(queued.id);
    expect(campaign?.status).toBe('cancelled');
    expect(campaign?.frozenContent).toBeNull();
    expect(send).not.toHaveBeenCalled();
  });

  test('failed queue publication releases preparation lock and retry can finish', async () => {
    const draft = await createNewsletterCampaignDraft(input);
    const update = NewsletterCampaign.findOneAndUpdate.bind(NewsletterCampaign);
    const adapter = NewsletterCampaign as unknown as { findOneAndUpdate: (...args: unknown[]) => unknown };
    spyOn(adapter, 'findOneAndUpdate').mockImplementation((...args) => {
      if (((args[1] as { $set?: { status?: string } }).$set)?.status === 'queued') return { lean: async () => { throw new Error('Simulated publication failure'); } };
      return update(...args as Parameters<typeof update>);
    });
    await expect(queueNewsletterCampaign({ campaignId: draft.id })).rejects.toThrow('Simulated publication failure');
    expect((await findCampaign(draft.id))?.preparationToken).toBeNull();
    mock.restore();
    expect((await queueNewsletterCampaign({ campaignId: draft.id }))?.status).toBe('queued');
    expect(await NewsletterDelivery.countDocuments({ campaignId: draft.id })).toBe(2);
  });

  test('missing sender configuration fails before claiming or failing any recipient', async () => {
    const queued = await queuedCampaign();
    delete process.env.POSTMARK_SERVER_TOKEN;
    await expect(dispatchQueuedNewsletterCampaigns()).rejects.toThrow('configured Postmark');
    expect(await NewsletterDelivery.countDocuments({ campaignId: queued.id, status: 'pending' })).toBe(2);
    expect((await findCampaign(queued.id))?.status).toBe('queued');
  });

  test('cron defaults to read-only dry-run with due campaigns and pending recipients', async () => {
    await queuedCampaign();
    const before = await NewsletterCampaign.find({}).lean();
    const deliveries = await NewsletterDelivery.find({}).lean();
    const send = spyOn(sender, 'sendNewsletterCampaignEmail').mockResolvedValue({ ok: true, messageId: 'never', error: '' });
    const response = await cronPost(new Request('https://example.test/api/internal/newsletter-dispatch-cron', { method: 'POST', headers: { 'x-cron-secret': 'local-cron-secret' }, body: '{}' }));
    expect(await response.json()).toMatchObject({ dryRun: true, dueCampaigns: 1, pendingDeliveries: 2, processingDeliveries: 0, needsReviewDeliveries: 0 });
    expect(await NewsletterCampaign.find({}).lean()).toEqual(before);
    expect(await NewsletterDelivery.find({}).lean()).toEqual(deliveries);
    expect(send).not.toHaveBeenCalled();
  });
});
