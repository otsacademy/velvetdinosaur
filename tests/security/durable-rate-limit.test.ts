import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { checkDurableRateLimit } from '@/lib/security/durable-rate-limit';
import { RequestLimit } from '@/models/RequestLimit';

// Runs only against the disposable loopback mongod started by
// `bun run test:security:integration`. Never connects to a site's database.
const run = process.env.SECURITY_MONGO_INTEGRATION === '1';
const dbName = `security_limit_test_${randomUUID().replaceAll('-', '')}`;
const previousUri = process.env.MONGODB_URI;
const address = 'alex@example.test';
let testUri = '';

function isTestDatabase() {
  return mongoose.connection.name === dbName && /^security_limit_test_[a-f0-9]{32}$/.test(dbName);
}

describe.skipIf(!run)('durable request limits in an isolated Mongo', () => {
  beforeAll(async () => {
    const uri = new URL(process.env.NEWSLETTER_TEST_MONGO_URI!);
    if (!['127.0.0.1', 'localhost'].includes(uri.hostname)) throw new Error('Tests require the disposable local Mongo.');
    uri.pathname = `/${dbName}`;
    testUri = uri.href;
    process.env.MONGODB_URI = testUri;
    await connectDB();
    if (!isTestDatabase()) throw new Error('Isolation failed.');
    await RequestLimit.init();
  });
  beforeEach(async () => {
    if (!isTestDatabase()) throw new Error('Refusing changes outside the test DB.');
    await RequestLimit.deleteMany({});
  });
  afterAll(async () => {
    if (isTestDatabase()) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
  });

  test('durable limits survive independent callers and allow exactly the configured count', async () => {
    const results = await Promise.all(Array.from({ length: 12 }, () => checkDurableRateLimit({ id: 'test', key: address, limit: 3, windowMs: 60_000 })));
    expect(results.filter((result) => result.ok)).toHaveLength(3);
    expect((await checkDurableRateLimit({ id: 'test', key: address, limit: 3, windowMs: 60_000 })).ok).toBe(false);
  });

  test('another process sees the same count, as after a restart', async () => {
    const input = { id: 'restart-test', key: address, limit: 2, windowMs: 60 * 60_000 };
    expect((await checkDurableRateLimit(input)).ok).toBe(true);
    // A separate bun process stands in for the next release slot or a restarted server.
    const child = Bun.spawn(['bun', '--no-env-file', '-e', `
      const { checkDurableRateLimit } = await import('@/lib/security/durable-rate-limit');
      const input = ${JSON.stringify(input)};
      const results = [await checkDurableRateLimit(input), await checkDurableRateLimit(input)];
      console.log(JSON.stringify(results.map((result) => result.ok)));
      process.exit(0);
    `], { cwd: process.cwd(), env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '', MONGODB_URI: testUri, POSTMARK_SERVER_TOKEN: '' }, stdout: 'pipe', stderr: 'pipe' });
    const [output, exitCode] = await Promise.all([new Response(child.stdout).text(), child.exited]);
    expect(exitCode).toBe(0);
    expect(JSON.parse(output.trim().split('\n').pop() || '[]')).toEqual([true, false]);
    expect((await checkDurableRateLimit(input)).ok).toBe(false);
  });

  test('stores only a hashed key with an expiry index, and starts again in the next window', async () => {
    const result = await checkDurableRateLimit({ id: 'expiry-test', key: address, limit: 1, windowMs: 1000 });
    expect(result.ok).toBe(true);
    const stored = await RequestLimit.findOne().lean<{ _id: string; count: number; expiresAt: Date }>();
    expect(stored?._id).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(stored)).not.toContain('alex');
    expect(stored?.count).toBe(1);
    expect(stored!.expiresAt.getTime()).toBeGreaterThan(Date.now() - 1000);
    expect(stored!.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
    const indexes = await RequestLimit.collection.indexes();
    expect(indexes.some((index) => index.key?.expiresAt === 1 && index.expireAfterSeconds === 0)).toBe(true);
    await Bun.sleep(1100);
    expect((await checkDurableRateLimit({ id: 'expiry-test', key: address, limit: 1, windowMs: 1000 })).ok).toBe(true);
  });
});
