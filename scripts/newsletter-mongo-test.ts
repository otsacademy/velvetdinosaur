import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:net';
import { MongoClient } from 'mongodb';

// A separate loopback-only mongod process. Never connects to a site's database.
const directory = await mkdtemp(path.join(tmpdir(), 'newsletter-mongo-test-'));
const probe = createServer();
await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve));
const address = probe.address();
if (!address || typeof address === 'string') throw new Error('Cannot allocate local test port.');
const port = address.port;
await new Promise<void>((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
const daemon = Bun.spawn(['mongod', '--dbpath', directory, '--port', String(port), '--bind_ip', '127.0.0.1', '--noauth', '--quiet', '--logpath', path.join(directory, 'mongo.log')], { stdout: 'ignore', stderr: 'pipe' });
let exitCode = 1;
try {
  const uri = `mongodb://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 150 });
    try { await client.connect(); await client.db('admin').command({ ping: 1 }); ready = true; break; }
    catch { await Bun.sleep(100); }
    finally { await client.close(); }
  }
  if (!ready) throw new Error('Isolated Mongo test server did not start.');
  const child = Bun.spawn(['bun', 'test', 'lib/newsletter/campaign-integration.test.ts'], {
    env: { ...process.env, NEWSLETTER_MONGO_INTEGRATION: '1', NEWSLETTER_TEST_MONGO_URI: uri }, stdout: 'inherit', stderr: 'inherit'
  });
  exitCode = await child.exited;
} finally {
  daemon.kill('SIGTERM');
  await daemon.exited;
  await rm(directory, { recursive: true, force: true });
}
process.exit(exitCode);
