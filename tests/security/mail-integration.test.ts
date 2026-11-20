import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { NewsletterPreference } from '@/models/NewsletterPreference';
import { NewsletterConsentEvent } from '@/models/NewsletterConsentEvent';
import { NewsletterSuppression } from '@/models/NewsletterSuppression';
import { EventRegistration } from '@/models/EventRegistration';
import { EventRegistrationEvent } from '@/models/EventRegistrationEvent';
import { EmailNotification } from '@/models/EmailNotification';
import { RequestLimit } from '@/models/RequestLimit';
import { requestNewsletterSubscription } from '@/lib/newsletter/signup-request';
import { requestEventRegistration } from '@/lib/event-registration/signup-request';
import { confirmNewsletterSubscriptionWithToken } from '@/lib/newsletter/confirm';
import { confirmEventRegistrationWithToken } from '@/lib/event-registration/confirm';
import { createNewsletterConfirmToken } from '@/lib/newsletter/confirm-token';
import { createEventRegistrationConfirmToken } from '@/lib/event-registration/confirm-token';
import { applyPostmarkEvent } from '@/lib/newsletter/postmark-suppression';
import { classifyPostmarkEvent } from '@/lib/newsletter/postmark-events';
import { enqueueNotification, dispatchNotifications } from '@/lib/email/notification-outbox';
import { checkDurableRateLimit } from '@/lib/security/durable-rate-limit';
import * as context from '@/lib/event-registration/event-context';
import * as newsletterSender from '@/lib/email/newsletter-lifecycle';
import * as eventSender from '@/lib/email/event-registration-lifecycle';

// ASAP's tests/security/mail-integration.test.ts (September repairs 4, 5, 7 and 8).
// Its event campaign dispatcher tests belong to the separate campaign repair
// (repair 3) and are not here. Runs only against the disposable loopback replica
// set started by `bun run test:security:integration`; no request leaves the process.
const run = process.env.SECURITY_MONGO_INTEGRATION === '1';
const dbName = `codex_security_test_${randomUUID().replaceAll('-', '')}`;
const previousEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const eventId = new mongoose.Types.ObjectId().toString();
const address = 'alex@example.test';
const accepted = { ok: true, messageId: 'test-message', error: '' };
const eventContext = { id: eventId, slug: 'test-event', title: 'Test event', dateLabel: 'Tomorrow', venue: 'Online', location: 'Virtual', registrationMode: 'local' as const, joiningInstructions: 'Join here', status: 'published' };
const signup = { email: address, firstName: 'Alex', source: 'test', legalTextVersion: 'v1', ip: '192.0.2.1', userAgent: 'test', doubleOptIn: true, blockSuppressed: true, ttlMinutes: 1440, cooldownMinutes: 15 };
const eventSignup = { ...signup, eventId, eventSlug: 'test-event', eventTitle: 'Test event', eventDateLabel: 'Tomorrow', eventLocation: 'Online', fullName: 'Alex Example' };

describe.skipIf(!run)('security repair integration in an isolated Mongo replica', () => {
  beforeAll(async () => {
    const uri = new URL(process.env.NEWSLETTER_TEST_MONGO_URI!);
    if (!['127.0.0.1', 'localhost'].includes(uri.hostname)) throw new Error('Tests require the disposable local replica.');
    uri.pathname = `/${dbName}`;
    process.env.MONGODB_URI = uri.href;
    process.env.POSTMARK_SERVER_TOKEN = 'test-no-network';
    process.env.POSTMARK_FROM_EMAIL = 'sender@example.test';
    process.env.NEWSLETTER_CONFIRM_SECRET = 'test-confirm-secret';
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.test';
    await mongoose.connect(uri.href, { serverSelectionTimeoutMS: 2000, bufferCommands: false });
    if (mongoose.connection.name !== dbName) throw new Error('Isolation failed.');
    await Promise.all([NewsletterPreference.init(), NewsletterConsentEvent.init(), NewsletterSuppression.init(),
      EventRegistration.init(), EventRegistrationEvent.init(), EmailNotification.init(), RequestLimit.init()]);
  });
  beforeEach(async () => {
    if (mongoose.connection.name !== dbName) throw new Error('Refusing changes outside the test DB.');
    for (const collection of await mongoose.connection.db!.collections()) await collection.deleteMany({});
    globalThis.fetch = (() => { throw new Error('Unexpected network request in test'); }) as unknown as typeof fetch;
    spyOn(context, 'getEventRegistrationContextById').mockResolvedValue(eventContext);
    spyOn(newsletterSender, 'sendNewsletterSubscribeConfirmationEmail').mockResolvedValue(accepted);
    spyOn(newsletterSender, 'sendNewsletterSubscriptionVerificationEmail').mockResolvedValue(accepted);
    spyOn(eventSender, 'sendEventRegistrationConfirmationEmail').mockResolvedValue(accepted);
    spyOn(eventSender, 'sendEventRegistrationVerificationEmail').mockResolvedValue(accepted);
  });
  afterEach(() => { mock.restore(); globalThis.fetch = originalFetch; });
  afterAll(async () => {
    if (mongoose.connection.name === dbName && /^codex_security_test_[a-f0-9]{32}$/.test(dbName)) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    for (const key of Object.keys(process.env)) if (!(key in previousEnv)) delete process.env[key];
    Object.assign(process.env, previousEnv);
  });

  async function registration(status = 'confirmed') {
    return EventRegistration.create({ eventId, eventSlug: 'test-event', eventTitle: 'Test event', email: address, fullName: 'Alex Example', status });
  }

  test('five simultaneous newsletter confirmations create one audit event and one notification', async () => {
    await NewsletterPreference.create({ userId: 'alex', email: address, firstName: 'Alex', status: 'pending' });
    const token = createNewsletterConfirmToken({ userId: 'alex', email: address })!;
    const results = await Promise.all(Array.from({ length: 5 }, () => confirmNewsletterSubscriptionWithToken(token)));
    expect(results.filter((result) => result.ok && result.status === 'confirmed')).toHaveLength(1);
    expect(await NewsletterConsentEvent.countDocuments({ eventType: 'subscribe' })).toBe(1);
    expect(await EmailNotification.countDocuments({ kind: 'newsletter-confirmed' })).toBe(1);
    expect(newsletterSender.sendNewsletterSubscribeConfirmationEmail).toHaveBeenCalledTimes(1);
  });
  test('five simultaneous event confirmations create one audit event and one notification', async () => {
    const row = await registration('pending');
    const token = createEventRegistrationConfirmToken({ registrationId: String(row._id), eventId, email: address })!;
    const results = await Promise.all(Array.from({ length: 5 }, () => confirmEventRegistrationWithToken(token)));
    expect(results.filter((result) => result.ok && result.status === 'confirmed')).toHaveLength(1);
    expect(await EventRegistrationEvent.countDocuments({ eventType: 'confirm' })).toBe(1);
    expect(eventSender.sendEventRegistrationConfirmationEmail).toHaveBeenCalledTimes(1);
  });
  test('concurrent signup requests keep one job and never demote confirmed membership', async () => {
    await Promise.all(Array.from({ length: 5 }, () => requestNewsletterSubscription(signup)));
    expect(await NewsletterPreference.countDocuments()).toBe(1);
    expect(await EmailNotification.countDocuments()).toBe(1);
    await NewsletterPreference.updateMany({}, { $set: { status: 'subscribed' } });
    await requestNewsletterSubscription({ ...signup, firstName: 'Attacker' });
    expect((await NewsletterPreference.findOne().lean<{ status: string; active: boolean; firstName: string }>())?.status).toBe('subscribed');
    expect((await NewsletterPreference.findOne().lean<{ status: string; active: boolean; firstName: string }>())?.firstName).toBe('Alex');
    await Promise.all(Array.from({ length: 5 }, () => requestEventRegistration(eventSignup)));
    expect(await EventRegistration.countDocuments()).toBe(1);
    expect(await EmailNotification.countDocuments({ kind: 'event-verify' })).toBe(1);
  });
  test('a signed-in account cannot rebind its preference to another address', async () => {
    await NewsletterPreference.create({ userId: 'account', email: 'own@example.test', status: 'subscribed' });
    expect(await requestNewsletterSubscription({ ...signup, userId: 'account' })).toBeNull();
    expect((await NewsletterPreference.findOne({ userId: 'account' }).lean<{ email: string; status: string }>())).toMatchObject({ email: 'own@example.test', status: 'subscribed' });
    expect(await NewsletterPreference.countDocuments()).toBe(1);
    expect(await EmailNotification.countDocuments()).toBe(0);
  });
  test('durable limits survive independent callers and allow exactly the configured count', async () => {
    const results = await Promise.all(Array.from({ length: 12 }, () => checkDurableRateLimit({ id: 'test', key: address, limit: 3, windowMs: 60_000 })));
    expect(results.filter((result) => result.ok)).toHaveLength(3);
    expect((await checkDurableRateLimit({ id: 'test', key: address, limit: 3, windowMs: 60_000 })).ok).toBe(false);
  });
  test('suppression events are ordered, idempotent and cannot grant or withdraw consent', async () => {
    await NewsletterPreference.create({ userId: 'alex', email: address, status: 'subscribed' });
    const event = { RecordType: 'SubscriptionChange', MessageStream: 'outbound', Recipient: address, SuppressSending: true, ChangedAt: '2026-09-26T12:00:00Z' };
    await applyPostmarkEvent(classifyPostmarkEvent(event)!);
    expect(await applyPostmarkEvent(classifyPostmarkEvent(event)!)).toBe(false);
    await applyPostmarkEvent(classifyPostmarkEvent({ ...event, SuppressSending: false, ChangedAt: '2026-09-26T11:00:00Z' })!);
    expect((await NewsletterSuppression.findOne().lean<{ status: string; active: boolean; firstName: string }>())?.active).toBe(true);
    expect((await NewsletterPreference.findOne().lean<{ status: string; active: boolean; firstName: string }>())?.status).toBe('subscribed');
    await NewsletterPreference.updateMany({}, { $set: { status: 'unsubscribed' } });
    await applyPostmarkEvent(classifyPostmarkEvent({ ...event, SuppressSending: false, ChangedAt: '2026-09-26T13:00:00Z' })!);
    expect((await NewsletterSuppression.findOne().lean<{ status: string; active: boolean; firstName: string }>())?.active).toBe(false);
    expect((await NewsletterPreference.findOne().lean<{ status: string; active: boolean; firstName: string }>())?.status).toBe('unsubscribed');
    expect(await NewsletterConsentEvent.countDocuments()).toBe(0);
  });
  test('recipient unsubscribe and spam complaint choices survive provider reactivation', async () => {
    await NewsletterPreference.create({ userId: 'alex', email: address, status: 'subscribed' });
    const event = { RecordType: 'SubscriptionChange', MessageStream: 'outbound', Recipient: address, Origin: 'Recipient', SuppressionReason: 'ManualSuppression', SuppressSending: true, ChangedAt: '2026-09-26T12:00:00Z' };
    await applyPostmarkEvent(classifyPostmarkEvent(event)!);
    await applyPostmarkEvent(classifyPostmarkEvent({ ...event, SuppressSending: false, SuppressionReason: null, MessageID: null, ChangedAt: '2026-09-26T13:00:00Z' })!);
    expect((await NewsletterPreference.findOne().lean<{ status: string }>())?.status).toBe('unsubscribed');
    expect(await NewsletterConsentEvent.countDocuments({ eventType: 'unsubscribe' })).toBe(1);
    expect(await EmailNotification.countDocuments()).toBe(0);
  });
  test('notification leases prevent duplicates; ambiguous failures are held for review', async () => {
    await NewsletterPreference.create({ userId: 'alex', email: address, status: 'subscribed' });
    await enqueueNotification({ key: 'test-job', kind: 'newsletter-confirmed', payload: { email: address } });
    const sender = spyOn(newsletterSender, 'sendNewsletterSubscribeConfirmationEmail').mockResolvedValue({ ok: false, messageId: '', error: 'network lost', ambiguous: true });
    await Promise.all([dispatchNotifications(), dispatchNotifications()]);
    await dispatchNotifications();
    expect(sender).toHaveBeenCalledTimes(1);
    expect((await EmailNotification.findOne().lean<{ status: string; active: boolean; firstName: string }>())?.status).toBe('needs_review');
  });
  test('a queued confirmation cannot tell a newly unsubscribed person they are subscribed', async () => {
    await NewsletterPreference.create({ userId: 'alex', email: address, status: 'unsubscribed' });
    await enqueueNotification({ key: 'stale', kind: 'newsletter-confirmed', payload: { email: address } });
    await dispatchNotifications();
    expect(newsletterSender.sendNewsletterSubscribeConfirmationEmail).not.toHaveBeenCalled();
    expect((await EmailNotification.findOne().lean<{ status: string; active: boolean; firstName: string }>())?.status).toBe('cancelled');
  });
  test('provider acceptance followed by a database failure never automatically resends', async () => {
    await NewsletterPreference.create({ userId: 'alex', email: address, status: 'subscribed' });
    await enqueueNotification({ key: 'lost-ack', kind: 'newsletter-confirmed', payload: { email: address } });
    spyOn(EmailNotification, 'updateOne').mockRejectedValueOnce(new Error('Database acknowledgement lost'));
    await dispatchNotifications();
    await dispatchNotifications();
    expect(newsletterSender.sendNewsletterSubscribeConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(await EmailNotification.countDocuments({ status: 'needs_review' })).toBe(1);
  });
  test('late recipient choices survive newer delivery events without overriding newer explicit consent', async () => {
    await NewsletterPreference.create({ userId: 'alex', email: address, status: 'subscribed', consentAt: new Date('2026-09-26T09:00:00Z') });
    const event = { RecordType: 'SubscriptionChange', MessageStream: 'outbound', Recipient: address,
      Origin: 'Recipient', SuppressionReason: 'ManualSuppression', SuppressSending: true, ChangedAt: '2026-09-26T12:00:00Z' };
    await applyPostmarkEvent(classifyPostmarkEvent({ ...event, SuppressSending: false, ChangedAt: '2026-09-26T13:00:00Z' })!);
    await applyPostmarkEvent(classifyPostmarkEvent(event)!);
    expect((await NewsletterPreference.findOne().lean<{ status: string }>())?.status).toBe('unsubscribed');
    expect((await NewsletterSuppression.findOne().lean<{ active: boolean }>())?.active).toBe(false);
    await NewsletterPreference.updateOne({}, { $set: { status: 'subscribed', consentAt: new Date('2026-09-26T14:00:00Z') } });
    await applyPostmarkEvent(classifyPostmarkEvent(event)!);
    expect((await NewsletterPreference.findOne().lean<{ status: string }>())?.status).toBe('subscribed');
    expect(await NewsletterConsentEvent.countDocuments({ eventType: 'unsubscribe' })).toBe(1);
  });
  test('provider bounces and reactivation cannot erase a manual suppression', async () => {
    await NewsletterSuppression.create({ email: address, active: true, source: 'admin', reason: 'Manual block' });
    const event = { RecordType: 'SubscriptionChange', MessageStream: 'outbound', Recipient: address,
      SuppressionReason: 'HardBounce', SuppressSending: true, ChangedAt: '2026-09-26T12:00:00Z' };
    await applyPostmarkEvent(classifyPostmarkEvent(event)!);
    await applyPostmarkEvent(classifyPostmarkEvent({ ...event, SuppressSending: false, ChangedAt: '2026-09-26T13:00:00Z' })!);
    expect(await NewsletterSuppression.findOne().lean()).toMatchObject({ active: true, source: 'admin', reason: 'Manual block' });
  });
  // Not in ASAP: the template's database helper does not wait for Model.init()
  // (a failed first init would stay cached and refuse every request), so the first
  // sign-up after a release may create the outbox and limit collections inside its
  // own transaction. Kept last: it drops and then rebuilds those indexes.
  test('the first sign-ups after a release create the new collections inside their transactions', async () => {
    await mongoose.connection.db!.dropCollection(EmailNotification.collection.collectionName);
    await mongoose.connection.db!.dropCollection(RequestLimit.collection.collectionName);
    const keys = await Promise.all(Array.from({ length: 5 }, () => requestNewsletterSubscription(signup)));
    expect(keys.filter(Boolean)).toHaveLength(1);
    expect(await NewsletterPreference.countDocuments({ status: 'pending' })).toBe(1);
    expect(await EmailNotification.countDocuments({ kind: 'newsletter-verify' })).toBe(1);
    await Promise.all([EmailNotification.createIndexes(), RequestLimit.createIndexes()]);
  });
});
