import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { createHmac, randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { mkdirSync, writeFileSync } from 'node:fs';
import mongoose from 'mongoose';
import { chromium, expect as browserExpect, type Browser } from '@playwright/test';
import { NewsletterPreference } from '@/models/NewsletterPreference';
import { NewsletterConsentEvent } from '@/models/NewsletterConsentEvent';
import { EmailNotification } from '@/models/EmailNotification';
import { EventRegistration } from '@/models/EventRegistration';
import { EventRegistrationEvent } from '@/models/EventRegistrationEvent';
import { createNewsletterConfirmToken } from './confirm-token';
import { createEventRegistrationConfirmToken } from '@/lib/event-registration/confirm-token';
import * as email from '@/lib/email/newsletter-lifecycle';
import { readUnsubscribePreferences } from './unsubscribe-preferences';
import { createNewsletterUnsubscribeToken } from './unsubscribe-token';
import { POST as confirm } from '@/app/api/newsletter/unsubscribe/route';
import { GET, HEAD, POST as oneClick } from '@/app/api/newsletter/unsubscribe/one-click/route';

const run = process.env.NEWSLETTER_UNSUBSCRIBE_INTEGRATION === '1';
const testDb = `codex_unsubscribe_test_${randomUUID().replaceAll('-', '')}`;
const previousEnv = { ...process.env };
const secret = 'isolated-unsubscribe-regression-secret';
const address = 'alex.morgan@example.test';
let server: ReturnType<typeof Bun.spawn> | undefined;
let browser: Browser | undefined;
let base = '';
let token = '';
let send: ReturnType<typeof spyOn<typeof email, 'sendNewsletterUnsubscribeConfirmationEmail'>>;
const preference = async () => await NewsletterPreference.findOne({ userId: 'alex' }).lean() as { status: string } | null;
const request = (body: unknown) => new Request('http://localhost/api/newsletter/unsubscribe', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Unsubscribe regression', 'x-real-ip': '192.0.2.10' }, body: JSON.stringify(body)
});
const oneClickRequest = (body: string, signed = token, contentType = 'application/x-www-form-urlencoded') => new Request(`http://localhost/api/newsletter/unsubscribe/one-click?token=${encodeURIComponent(signed)}`, {
  method: 'POST', headers: { 'Content-Type': contentType }, body
});

describe.skipIf(!run)('unsubscribe regression with isolated Mongo and real HTTP/browser', () => {
  beforeAll(async () => {
    const testUri = process.env.NEWSLETTER_TEST_MONGO_URI;
    if (!testUri) throw new Error('Isolated Mongo test URI required');
    const uri = new URL(testUri);
    uri.pathname = `/${testDb}`;
    process.env.MONGODB_URI = uri.href;
    process.env.POSTMARK_SERVER_TOKEN = ''; // Child HTTP server cannot send mail.
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = secret;
    process.env.BETTERAUTH_SECRET = 'isolated-auth-test-secret-at-least-32-characters';
    await mongoose.connect(uri.href, { bufferCommands: false });
    if (mongoose.connection.name !== testDb) throw new Error('Isolation failed');
    await Promise.all([NewsletterPreference.init(), NewsletterConsentEvent.init(), EmailNotification.init(), EventRegistration.init(), EventRegistrationEvent.init()]);
    const probe = createServer();
    // NEWSLETTER_TEST_HTTP_PORT pins a known free loopback port; otherwise the system picks one.
    const requestedPort = Number(process.env.NEWSLETTER_TEST_HTTP_PORT || 0);
    await new Promise<void>((resolve) => probe.listen(Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 0, '127.0.0.1', resolve));
    const listening = probe.address();
    if (!listening || typeof listening === 'string') throw new Error('No test port');
    const port = listening.port;
    await new Promise<void>((resolve) => probe.close(() => resolve()));
    base = `http://127.0.0.1:${port}`;
    mkdirSync('test-results', { recursive: true });
    writeFileSync('test-results/unsubscribe-server.log', '');
    writeFileSync('test-results/unsubscribe-server-error.log', '');
    server = Bun.spawn(['bun', 'run', 'start', '-p', String(port), '-H', '127.0.0.1'], {
      env: { ...process.env, NEXT_PUBLIC_LHCI: 'true', VISUAL_TEST: '1', POSTMARK_SERVER_TOKEN: '', CANONICAL_ORIGIN: base, PUBLIC_BASE_URL: base, BETTER_AUTH_URL: base },
      stdout: Bun.file('test-results/unsubscribe-server.log'), stderr: Bun.file('test-results/unsubscribe-server-error.log')
    });
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      try { if ((await fetch(`${base}/api/session`)).ok) { ready = true; break; } } catch { /* starting */ }
      await Bun.sleep(100);
    }
    if (!ready) throw new Error('Test HTTP server did not start');
    browser = await chromium.launch({ headless: true });
    token = createNewsletterUnsubscribeToken({ email: address, campaignId: 'existing-campaign' });
  }, 30_000);

  beforeEach(async () => {
    if (mongoose.connection.name !== testDb) throw new Error('Refusing mutation outside test database');
    await NewsletterPreference.deleteMany({});
    await NewsletterConsentEvent.deleteMany({});
    await EmailNotification.deleteMany({});
    await EventRegistration.deleteMany({});
    await EventRegistrationEvent.deleteMany({});
    await NewsletterPreference.create({ userId: 'alex', email: address, firstName: 'Alex', status: 'subscribed', legalTextVersion: 'v2' });
    send = spyOn(email, 'sendNewsletterUnsubscribeConfirmationEmail').mockResolvedValue({ ok: true, messageId: 'test-receipt', error: '' });
  });
  afterEach(() => mock.restore());
  afterAll(async () => {
    await browser?.close();
    server?.kill('SIGTERM');
    if (server) await server.exited;
    if (mongoose.connection.name === testDb && /^codex_unsubscribe_test_[a-f0-9]{32}$/.test(testDb)) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    for (const key of Object.keys(process.env)) if (!(key in previousEnv)) delete process.env[key];
    Object.assign(process.env, previousEnv);
  });

  test('scanner GET/HEAD, repeat visits and header redirects never unsubscribe', async () => {
    for (const method of ['GET', 'HEAD']) {
      for (const path of ['/newsletter/unsubscribe', '/api/newsletter/unsubscribe/one-click']) {
        const response = await fetch(`${base}${path}?token=${encodeURIComponent(token)}`, { method, redirect: 'follow' });
        expect(response.ok).toBe(true);
        expect(new URL(response.url).origin).toBe(base);
        expect(response.headers.get('cache-control')).toContain('no-store');
        expect(response.headers.get('referrer-policy')).toBe('no-referrer');
        expect(response.headers.get('x-robots-tag')).toContain('noindex');
        if (method === 'GET') expect(await response.text()).toContain('Yes, unsubscribe');
      }
    }
    const proxied = await fetch(`${base}/api/newsletter/unsubscribe/one-click?token=${token}`, { headers: { Host: 'www.example.org', 'X-Forwarded-Proto': 'https' }, redirect: 'manual' });
    expect(proxied.status).toBe(303);
    expect(proxied.headers.get('location')).toBe(`/newsletter/unsubscribe?token=${token}`);
    await readUnsubscribePreferences(token);
    await readUnsubscribePreferences(token);
    expect((await preference())?.status).toBe('subscribed');
    expect(await NewsletterConsentEvent.countDocuments()).toBe(0);
    expect(send).not.toHaveBeenCalled();
    expect(GET(new Request(`${base}/api/newsletter/unsubscribe/one-click?token=${token}`)).status).toBe(303);
    expect(HEAD(new Request(`${base}/api/newsletter/unsubscribe/one-click?token=${token}`)).status).toBe(303);
  });

  test('newsletter and event confirmation links are read-only until an explicit POST', async () => {
    await NewsletterPreference.updateOne({ userId: 'alex' }, { $set: { status: 'pending' } });
    const eventId = new mongoose.Types.ObjectId().toString();
    const registration = await EventRegistration.create({ eventId, eventSlug: 'test-event', eventTitle: 'Test event', email: address, fullName: 'Alex Morgan', status: 'pending' });
    const newsletterToken = createNewsletterConfirmToken({ userId: 'alex', email: address })!;
    const eventToken = createEventRegistrationConfirmToken({ registrationId: String(registration._id), eventId, email: address })!;
    for (const [path, signed, endpoint] of [
      ['/newsletter/confirm', newsletterToken, '/api/newsletter/confirm'],
      ['/events/registration/confirm', eventToken, '/api/events/registration/confirm']
    ]) {
      for (const method of ['GET', 'HEAD']) {
        const response = await fetch(`${base}${path}?token=${encodeURIComponent(signed)}`, { method });
        expect(response.ok).toBe(true);
        expect(response.headers.get('cache-control')).toContain('no-store');
        expect(response.headers.get('referrer-policy')).toBe('no-referrer');
        expect(response.headers.get('x-robots-tag')).toContain('noindex');
        if (method === 'GET') expect(await response.text()).toContain('Confirm your');
      }
      const missing = await fetch(`${base}${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: signed }) });
      expect(missing.status).toBe(400);
      const crossSite = await fetch(`${base}${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json', Origin: 'https://attacker.invalid' }, body: JSON.stringify({ token: signed, confirmed: true }) });
      expect(crossSite.status).toBe(403);
    }
    expect((await preference())?.status).toBe('pending');
    expect(await NewsletterConsentEvent.countDocuments()).toBe(0);
    expect(await EventRegistrationEvent.countDocuments()).toBe(0);
    expect(await EmailNotification.countDocuments()).toBe(0);
    const page = await browser!.newPage();
    await page.goto(`${base}/newsletter/confirm?token=${encodeURIComponent(newsletterToken)}`);
    await page.getByRole('button', { name: 'Confirm subscription', exact: true }).click();
    await browserExpect(page.getByText('Your subscription is confirmed.', { exact: true })).toBeVisible();
    expect((await preference())?.status).toBe('subscribed');
    expect(await NewsletterConsentEvent.countDocuments({ eventType: 'subscribe' })).toBe(1);
    expect(await EmailNotification.countDocuments({ kind: 'newsletter-confirmed' })).toBe(1);
    await page.close();
  }, 30_000);

  test('confirmed POST records consent metadata; concurrent retries send exactly one email', async () => {
    // Multiple accounts can share an address: the transaction must cover all of them.
    await NewsletterPreference.create({ userId: 'alex-duplicate', email: address, status: 'subscribed' });
    const responses = await Promise.all(Array.from({ length: 5 }, () => confirm(request({ token, confirmed: true }))));
    const results = await Promise.all(responses.map((response) => response.json()));
    expect(results.every((result) => result.ok)).toBe(true);
    expect(results.reduce((sum, result) => sum + result.updated, 0)).toBe(2);
    expect(await NewsletterPreference.countDocuments({ status: 'unsubscribed' })).toBe(2);
    expect(await NewsletterConsentEvent.countDocuments()).toBe(2);
    const event = await NewsletterConsentEvent.findOne({ userId: 'alex' }).lean() as { source: string; actorId: string; userAgent: string; ipHash: string; legalTextVersion: string } | null;
    expect(event?.source).toBe('newsletter-unsubscribe-confirmation');
    expect(event?.actorId).toBe('existing-campaign');
    expect(event?.userAgent).toBe('Unsubscribe regression');
    expect(event?.ipHash).toHaveLength(64);
    expect(event?.legalTextVersion).toBe('v2');
    expect(send).toHaveBeenCalledTimes(1);
    expect((await readUnsubscribePreferences(token)).status).toBe('already');
  });

  test('missing confirmation, invalid tokens and malformed one-click requests never mutate', async () => {
    expect((await confirm(request({ token }))).status).toBe(400);
    expect((await confirm(request({ token, confirmed: false }))).status).toBe(400);
    expect((await confirm(request({ token: 'invalid', confirmed: true }))).status).toBe(400);
    for (const body of ['', 'List-Unsubscribe=No', 'token=anything']) expect((await oneClick(oneClickRequest(body))).status).toBe(400);
    expect((await oneClick(oneClickRequest('{}', token, 'application/json'))).status).toBe(400);
    expect((await oneClick(oneClickRequest('List-Unsubscribe=One-Click', 'invalid'))).status).toBe(400);
    const payload = Buffer.from(JSON.stringify({ e: address, iat: 1, exp: 2, c: 'old-campaign' })).toString('base64url');
    const expired = `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
    expect((await confirm(request({ token: expired, confirmed: true }))).status).toBe(400);
    expect((await readUnsubscribePreferences(expired)).status).toBe('expired');
    expect((await preference())?.status).toBe('subscribed');
    expect(await NewsletterConsentEvent.countDocuments()).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  test('RFC 8058 form POST still works and repeating it does not send again', async () => {
    expect((await oneClick(oneClickRequest('List-Unsubscribe=One-Click'))).status).toBe(200);
    expect((await oneClick(oneClickRequest('List-Unsubscribe=One-Click'))).status).toBe(200);
    expect((await preference())?.status).toBe('unsubscribed');
    expect(await NewsletterConsentEvent.countDocuments({ actorType: 'one-click' })).toBe(1);
    expect(send).toHaveBeenCalledTimes(1);
  });

  test('audit write failure rolls back the unsubscribe and sends no notification', async () => {
    spyOn(NewsletterConsentEvent, 'create').mockRejectedValueOnce(new Error('Simulated audit outage'));
    expect((await confirm(request({ token, confirmed: true }))).status).toBe(503);
    expect((await preference())?.status).toBe('subscribed');
    expect(send).not.toHaveBeenCalled();
  });

  test('inactive and missing preferences are represented accurately', async () => {
    await NewsletterPreference.updateOne({ userId: 'alex' }, { $set: { status: 'pending' } });
    expect((await readUnsubscribePreferences(token)).status).toBe('inactive');
    await NewsletterPreference.deleteMany({});
    expect((await readUnsubscribePreferences(token)).status).toBe('inactive');
    expect(send).not.toHaveBeenCalled();
  });

  test('desktop and mobile cancellation make no write; confirmation submits and focuses the result', async () => {
    for (const width of [1440, 390, 320]) {
      const page = await browser!.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const writes: string[] = [];
      page.on('request', (request) => { if (request.method() === 'POST' && request.url().includes('/newsletter/')) writes.push(request.url()); });
      await page.goto(`${base}/newsletter/unsubscribe?token=${token}`, { waitUntil: 'networkidle' });
      await browserExpect(page.getByRole('button', { name: 'Yes, unsubscribe' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect((await page.getByRole('button', { name: 'Yes, unsubscribe' }).boundingBox())!.height).toBeGreaterThanOrEqual(48);
      await page.screenshot({ path: `test-results/unsubscribe-confirm-${width}.png`, fullPage: true });
      await page.getByRole('button', { name: 'Keep me subscribed' }).click();
      await browserExpect(page.getByRole('heading', { name: 'You’re still subscribed.' })).toBeFocused();
      expect(writes).toHaveLength(0);
      expect((await preference())?.status).toBe('subscribed');
      await page.close();
    }
    const page = await browser!.newPage();
    await page.goto(`${base}/newsletter/unsubscribe?token=${token}`);
    await page.getByRole('button', { name: 'Yes, unsubscribe' }).focus();
    await page.keyboard.press('Enter');
    await browserExpect(page.getByRole('heading', { name: 'You’re unsubscribed.', exact: true })).toBeFocused();
    expect((await preference())?.status).toBe('unsubscribed');
    expect(await NewsletterConsentEvent.countDocuments()).toBe(1);
    await page.reload();
    await browserExpect(page.getByRole('heading', { name: 'You’re already unsubscribed.' })).toBeVisible();
    expect(await NewsletterConsentEvent.countDocuments()).toBe(1);
    await page.close();
  }, 40_000);

  test('network failure stays retryable; invalid links expose no unsubscribe button; cross-site JSON is rejected', async () => {
    const page = await browser!.newPage();
    await page.goto(`${base}/newsletter/unsubscribe?token=${token}`);
    await page.route('**/api/newsletter/unsubscribe', (route) => route.abort());
    await page.getByRole('button', { name: 'Yes, unsubscribe' }).click();
    await browserExpect(page.getByRole('alert').filter({ hasText: 'We couldn’t confirm your request.' })).toBeFocused();
    await browserExpect(page.getByRole('button', { name: 'Yes, unsubscribe' })).toBeEnabled();
    await browserExpect(page.getByText('You’re still subscribed.', { exact: true })).toHaveCount(0);
    expect((await preference())?.status).toBe('subscribed');
    await page.goto(`${base}/newsletter/unsubscribe?token=invalid`);
    await browserExpect(page.getByRole('heading', { name: 'This link isn’t valid.' })).toBeVisible();
    await browserExpect(page.getByRole('button', { name: 'Yes, unsubscribe' })).toHaveCount(0);
    await page.close();
    const response = await fetch(`${base}/api/newsletter/unsubscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://untrusted.example' }, body: JSON.stringify({ token, confirmed: true }) });
    expect(response.status).toBe(403);
    expect((await preference())?.status).toBe('subscribed');
  });
});
