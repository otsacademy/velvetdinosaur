import { readdir, readFile, realpath, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { MongoClient } from 'mongodb';
import { readNewsletterEnvironment } from '@/lib/newsletter/operations';

const appsRoot = '/srv/apps';
const args = process.argv.slice(2);
const includeDatabase = args.includes('--database-summary');
const hub = await readNewsletterEnvironment(path.join(appsRoot, 'velvetdinosaur/.env.production'));
const knownSites = new Set(['velvetdinosaur', 'asap', 'thebrave']);
const exists = (file: string) => access(file).then(() => true, () => false);
const git = (root: string, ...command: string[]) => {
  const result = spawnSync('git', ['-C', root, ...command], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
};
const sites = [];
for (const entry of await readdir(appsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || /(?:-blue|-green|-current)$/.test(entry.name) || entry.name.startsWith('.')) continue;
  const source = path.join(appsRoot, entry.name);
  const envFile = path.join(source, '.env.production');
  if (!await exists(envFile)) continue;
  const env = await readNewsletterEnvironment(envFile);
  if (!knownSites.has(entry.name) && env.VD_DEMO_SITE !== 'true') continue;
  const deployFile = path.join(source, 'deploy/local-first.json');
  const config = await exists(deployFile) ? JSON.parse(await readFile(deployFile, 'utf8')) : {};
  const activeLink = config.activeLink || env.VD_DEPLOY_ACTIVE_LINK || path.join(appsRoot, `${entry.name}-current`);
  const active = await realpath(activeLink).catch(() => null);
  const row: Record<string, unknown> = {
    slug: entry.name, source, active, domain: env.DOMAIN,
    isDemo: env.VD_DEMO_SITE === 'true',
    sourceCommit: git(source, 'rev-parse', 'HEAD'), sourceBranch: git(source, 'branch', '--show-current'),
    sourceDirty: Boolean(git(source, 'status', '--porcelain')),
    deployedCommit: active ? git(active, 'rev-parse', 'HEAD') : null,
    tokenConfigured: Boolean(env.POSTMARK_SERVER_TOKEN),
    sharesHubToken: Boolean(env.POSTMARK_SERVER_TOKEN) && env.POSTMARK_SERVER_TOKEN === hub.POSTMARK_SERVER_TOKEN,
    sharesHubBucket: (env.R2_BUCKET || env.R2_BUCKET_NAME) === (hub.R2_BUCKET || hub.R2_BUCKET_NAME),
    newsletterSendOptIn: env.NEWSLETTER_ALLOW_DEMO_SEND === 'true'
  };
  if (includeDatabase && env.MONGODB_URI) {
    const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 5_000 });
    try {
      await client.connect();
      const db = client.db();
      const campaigns = await db.collection('newslettercampaigns').aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).toArray();
      const deliveries = await db.collection('newsletterdeliveries').aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).toArray();
      row.campaignCounts = campaigns;
      row.deliveryCounts = deliveries;
      row.assetCount = await db.collection('assets').countDocuments();
    } catch {
      row.databaseReadError = true;
    } finally {
      await client.close();
    }
  }
  sites.push(row);
}
sites.sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
const report = { generatedAt: new Date().toISOString(), count: sites.length, sites };
const output = args.find((arg) => arg.startsWith('--output='))?.slice('--output='.length);
if (output) {
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ count: sites.length, output, databaseReadErrors: sites.filter((s) => s.databaseReadError).length }));
} else {
  console.log(JSON.stringify(report, null, 2));
}
