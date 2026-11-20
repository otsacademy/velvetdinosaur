import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:net';
import { MongoClient } from 'mongodb';

// A separate loopback-only mongod process. Never connects to a site's database.
const directory = await mkdtemp(path.join(tmpdir(), 'newsletter-mongo-test-'));
const probe = createServer();
// NEWSLETTER_TEST_MONGO_PORT pins a known free port; otherwise the system picks one.
const requestedPort = Number(process.env.NEWSLETTER_TEST_MONGO_PORT || 0);
await new Promise<void>((resolve, reject) => {
  probe.once('error', reject);
  probe.listen(Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 0, '127.0.0.1', resolve);
});
const address = probe.address();
if (!address || typeof address === 'string') throw new Error('Cannot allocate local test port.');
const port = address.port;
await new Promise<void>((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
// A one-member replica set: consent, audit and notification writes commit in transactions.
const daemon = Bun.spawn(['mongod', '--dbpath', directory, '--port', String(port), '--bind_ip', '127.0.0.1', '--noauth', '--replSet', 'newsletter-test', '--quiet', '--logpath', path.join(directory, 'mongo.log')], { stdout: 'ignore', stderr: 'pipe' });
let exitCode = 1;
try {
  const uri = `mongodb://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 150, directConnection: true });
    try { await client.connect(); await client.db('admin').command({ ping: 1 }); ready = true; break; }
    catch { await Bun.sleep(100); }
    finally { await client.close(); }
  }
  if (!ready) throw new Error('Isolated Mongo test server did not start.');
  const replica = new MongoClient(uri, { directConnection: true });
  try {
    await replica.connect();
    await replica.db('admin').command({ replSetInitiate: { _id: 'newsletter-test', members: [{ _id: 0, host: `127.0.0.1:${port}` }] } });
    let primary = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if ((await replica.db('admin').command({ hello: 1 })).isWritablePrimary) { primary = true; break; }
      await Bun.sleep(100);
    }
    if (!primary) throw new Error('Isolated test replica did not elect a primary.');
  } finally { await replica.close(); }
  const unsubscribe = process.argv.includes('--unsubscribe');
  const security = process.argv.includes('--security');
  // Each file runs in its own process: they connect the shared Mongoose instance to their own databases.
  const files = security ? ['tests/security/durable-rate-limit.test.ts', 'tests/security/mail-integration.test.ts', 'tests/security/csp-report.test.ts']
    : [unsubscribe ? 'lib/newsletter/unsubscribe-integration.test.ts' : 'lib/newsletter/campaign-integration.test.ts'];
  exitCode = 0;
  for (const file of files) {
    const child = Bun.spawn(['bun', 'test', file], {
      env: { ...process.env, SECURITY_MONGO_INTEGRATION: security ? '1' : '0', NEWSLETTER_MONGO_INTEGRATION: '1', NEWSLETTER_TEST_MONGO_URI: uri, NEWSLETTER_UNSUBSCRIBE_INTEGRATION: unsubscribe ? '1' : '0' }, stdout: 'inherit', stderr: 'inherit'
    });
    const code = await child.exited;
    if (code !== 0) exitCode = code;
  }
} finally {
  daemon.kill('SIGTERM');
  await daemon.exited;
  await rm(directory, { recursive: true, force: true });
}
process.exit(exitCode);
