import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { POST } from '@/app/api/csp-report/route';
import { recordCspReport } from '@/lib/security/csp-reports';
import { CspReportCount } from '@/models/CspReportCount';
import { RequestLimit } from '@/models/RequestLimit';

// Runs only against the disposable loopback mongod started by
// `bun run test:security:integration`. Never connects to a site's database.
const run = process.env.SECURITY_MONGO_INTEGRATION === '1';
const dbName = `security_csp_test_${randomUUID().replaceAll('-', '')}`;
const previousUri = process.env.MONGODB_URI;

function isTestDatabase() {
  return mongoose.connection.name === dbName && /^security_csp_test_[a-f0-9]{32}$/.test(dbName);
}

function report(body: Record<string, string>, headers: Record<string, string> = {}) {
  return POST(new Request('http://127.0.0.1/api/csp-report', {
    method: 'POST',
    headers: { 'content-type': 'application/csp-report', 'x-real-ip': '192.0.2.7', ...headers },
    body: JSON.stringify({ 'csp-report': body })
  }));
}

describe.skipIf(!run)('report-only policy reports in an isolated Mongo', () => {
  beforeAll(async () => {
    const uri = new URL(process.env.NEWSLETTER_TEST_MONGO_URI!);
    if (!['127.0.0.1', 'localhost'].includes(uri.hostname)) throw new Error('Tests require the disposable local Mongo.');
    uri.pathname = `/${dbName}`;
    process.env.MONGODB_URI = uri.href;
    await connectDB();
    if (!isTestDatabase()) throw new Error('Isolation failed.');
    await CspReportCount.init();
    await RequestLimit.init();
  });
  beforeEach(async () => {
    if (!isTestDatabase()) throw new Error('Refusing changes outside the test DB.');
    await CspReportCount.deleteMany({});
    await RequestLimit.deleteMany({});
  });
  afterAll(async () => {
    if (isTestDatabase()) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
  });

  test('a report is counted by directive and blocked host only', async () => {
    const body = {
      'document-uri': 'https://site.example/newsletter/confirm?token=secret',
      'effective-directive': 'script-src-elem',
      'blocked-uri': 'https://tracker.example:8443/collect?visitor=alex@example.test',
      'source-file': 'https://site.example/page',
      referrer: 'https://search.example/?q=alex'
    };
    expect((await report(body)).status).toBe(204);
    expect((await report(body, { 'x-real-ip': '192.0.2.8' })).status).toBe(204);
    const stored = await CspReportCount.find({}).lean();
    expect(stored).toHaveLength(1);
    const [row] = stored as unknown as Array<Record<string, unknown>>;
    expect(row.directive).toBe('script-src-elem');
    expect(row.blocked).toBe('https://tracker.example:8443');
    expect(row.count).toBe(2);
    expect(Object.keys(row).sort()).toEqual(['_id', 'blocked', 'count', 'day', 'directive', 'expiresAt']);
    expect(JSON.stringify(stored)).not.toContain('alex');
    expect(JSON.stringify(stored)).not.toContain('192.0.2');
  }, 30_000);

  test('one address is counted at most 20 times in ten minutes', async () => {
    for (let i = 0; i < 25; i++) await report({ 'effective-directive': 'img-src', 'blocked-uri': 'https://images.example/a.png' });
    const row = await CspReportCount.findOne({ directive: 'img-src' }).lean() as unknown as { count: number };
    expect(row.count).toBe(20);
  }, 30_000);

  test('unknown directives, other content types and oversized bodies are ignored', async () => {
    expect((await report({ 'effective-directive': 'made-up-src', 'blocked-uri': 'https://a.example' })).status).toBe(204);
    const wrongType = await POST(new Request('http://127.0.0.1/api/csp-report', {
      method: 'POST', headers: { 'content-type': 'text/plain' },
      body: JSON.stringify({ 'csp-report': { 'effective-directive': 'img-src', 'blocked-uri': 'https://b.example' } })
    }));
    expect(wrongType.status).toBe(204);
    expect((await report({ 'effective-directive': 'img-src', 'blocked-uri': `https://c.example/${'x'.repeat(20_000)}` })).status).toBe(204);
    expect(await CspReportCount.countDocuments({})).toBe(0);
  }, 30_000);

  test('at most 300 different sources are kept per day', async () => {
    const now = new Date('2026-11-20T12:00:00Z');
    const expiresAt = new Date('2027-02-18T12:00:00Z');
    await CspReportCount.insertMany(Array.from({ length: 299 }, (_, i) =>
      ({ day: '2026-11-20', directive: 'img-src', blocked: `https://h${i}.example`, count: 1, expiresAt })));
    expect(await recordCspReport({ directive: 'img-src', blocked: 'https://last-kept.example' }, now)).toBe(true);
    expect(await recordCspReport({ directive: 'img-src', blocked: 'https://one-too-many.example' }, now)).toBe(false);
    expect(await recordCspReport({ directive: 'img-src', blocked: 'https://h7.example' }, now)).toBe(true);
    expect(await CspReportCount.countDocuments({ day: '2026-11-20' })).toBe(300);
    expect(await recordCspReport({ directive: 'img-src', blocked: 'https://next-day.example' }, new Date('2026-11-21T00:00:01Z'))).toBe(true);
  }, 30_000);
});
