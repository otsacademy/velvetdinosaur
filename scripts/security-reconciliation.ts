import { chmod, writeFile } from 'node:fs/promises';
import { MongoClient } from 'mongodb';
import { readNewsletterEnvironment } from '@/lib/newsletter/operations';

// Read-only. It intentionally has no apply mode: historical consent must never
// be inferred from a bounce or restored in bulk.
const args = process.argv.slice(2);
const envPath = args.find((arg) => arg.startsWith('--env-file='))?.slice(11) || '.env.production';
const output = args.find((arg) => arg.startsWith('--output='))?.slice(9);
const env = await readNewsletterEnvironment(envPath);
if (!env.MONGODB_URI) throw new Error('Selected environment has no database URI.');
const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
try {
  await client.connect();
  const db = client.db();
  const candidates = await db.collection('newsletterconsentevents').aggregate([
    { $match: { eventType: 'unsubscribe', source: 'postmark-webhook:bounce', reason: /SoftBounce|Transient|DnsError|DnsLookup|MailboxFull|MessageDelayed/i } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$email', lastIncorrectBounce: { $first: '$$ROOT' } } },
    { $lookup: { from: 'newsletterpreferences', localField: '_id', foreignField: 'email', as: 'currentPreferences' } },
    { $lookup: { from: 'newslettersuppressions', localField: '_id', foreignField: 'email', as: 'currentSuppression' } },
    { $project: { _id: 0, email: '$_id', lastIncorrectBounce: 1, currentPreferences: 1, currentSuppression: 1 } }
  ]).toArray();
  const legacyActiveFiles = await db.collection('assets').find({ $or: [
    { mime: /^(text\/html|application\/(xhtml\+xml|javascript|xml)|image\/svg\+xml)$/i },
    { key: /\.(html?|xhtml|js|mjs|svg)$/i }
  ] }, { projection: { key: 1, mime: 1, bucket: 1, processingStatus: 1 } }).toArray();
  const [queuedEventCampaigns, sendingEventCampaigns, pendingEventDeliveries, uncertainEventDeliveries] = await Promise.all([
    db.collection('eventregistrationcampaigns').countDocuments({ status: 'queued' }),
    db.collection('eventregistrationcampaigns').countDocuments({ status: 'sending' }),
    db.collection('eventregistrationdeliveries').countDocuments({ status: 'pending' }),
    db.collection('eventregistrationdeliveries').countDocuments({ status: { $in: ['processing', 'needs_review'] } })
  ]);
  const summary = { bounceReconciliationCandidates: candidates.length, legacyActiveFiles: legacyActiveFiles.length,
    queuedEventCampaigns, sendingEventCampaigns, pendingEventDeliveries, uncertainEventDeliveries };
  if (output) {
    await writeFile(output, JSON.stringify({ generatedAt: new Date().toISOString(), summary, candidates, legacyActiveFiles,
      instructions: 'Review the consent audit and Postmark activity individually. This report does not authorize resubscription or delivery retries.' }, null, 2) + '\n', { mode: 0o600 });
    await chmod(output, 0o600);
  }
  console.log(JSON.stringify({ ...summary, ...(output ? { report: output } : {}) }));
} finally { await client.close(); }
