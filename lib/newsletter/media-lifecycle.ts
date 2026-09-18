import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { NewsletterMedia } from '@/models/NewsletterMedia';
import { NewsletterCampaign } from '@/models/NewsletterCampaign';
import { getR2Client } from '@/lib/r2';
import { NEWSLETTER_RETENTION_MS } from './media-validation';
import { requireMediaDatabase, type NewsletterMediaRecord } from './media-storage';
import type { NewsletterMediaManifest } from './media-types';

export async function releaseNewsletterMedia(manifest: NewsletterMediaManifest, completedAt = new Date()) {
  const ownerSite = await requireMediaDatabase();
  const expiresAt = new Date(Math.max(Date.now(), completedAt.getTime()) + NEWSLETTER_RETENTION_MS);
  await NewsletterMedia.updateMany({
    ownerSite, kind: 'attachment', id: { $in: manifest.attachments.map((item) => item.id) }, deletingAt: null,
  }, { $max: { expiresAt } });
}

async function hasActiveReference(candidate: NewsletterMediaRecord) {
  return NewsletterCampaign.exists({ $or: [
    { status: { $in: ['queued', 'sending'] }, 'frozenContent.manifest.attachments.id': candidate.id },
    {
      status: { $in: ['completed', 'cancelled'] }, 'frozenContent.manifest.attachments.id': candidate.id,
      $or: [{ completedAt: { $gte: new Date(Date.now() - NEWSLETTER_RETENTION_MS) } }, { updatedAt: { $gte: new Date(Date.now() - NEWSLETTER_RETENTION_MS) } }],
    },
    ...(candidate.kind === 'image' ? [
      { 'visualBody.renditionId': candidate.id },
      { htmlBody: { $regex: `/api/newsletter/media/${candidate.id}` } },
      { 'frozenContent.manifest.images.id': candidate.id },
    ] : []),
    ...(candidate.campaignId ? [{ _id: candidate.campaignId, preparationToken: { $ne: null } }] : []),
  ] });
}

// Queue/dispatch calls this bounded runner. It can also be called by maintenance.
// A claim prevents preparation from retaining a record while it is being deleted.
export async function cleanupNewsletterMedia({ limit = 20, dryRun = false }: { limit?: number; dryRun?: boolean } = {}) {
  const ownerSite = await requireMediaDatabase();
  let removed = 0;
  let failed = 0;
  let eligible = 0;
  const cutoff = new Date();
  const query = {
    ownerSite, retained: { $ne: true },
    $and: [
      { $or: [
        { expiresAt: { $lte: cutoff } },
        // A crash before persisting a frozen manifest can leave a pinned file.
        { kind: 'attachment', expiresAt: null, createdAt: { $lte: new Date(Date.now() - NEWSLETTER_RETENTION_MS) } },
      ] },
      { $or: [{ deletingAt: null }, { deletingAt: { $lt: new Date(Date.now() - 10 * 60 * 1000) } }] },
      { $or: [{ writingUntil: null }, { writingUntil: { $lte: cutoff } }] },
    ],
  };
  const candidates = await NewsletterMedia.find(query).sort({ expiresAt: 1 }).limit(Math.min(100, Math.max(1, limit))).lean().exec() as unknown as NewsletterMediaRecord[];
  for (const candidate of candidates) {
    // Protect current dispatches and preparation, including cancellation races.
    if (await hasActiveReference(candidate)) continue;
    eligible += 1;
    if (dryRun) continue;
    const record = await NewsletterMedia.findOneAndUpdate({ ...query, id: candidate.id }, { $set: { deletingAt: new Date() } }, { new: true }).lean().exec() as NewsletterMediaRecord | null;
    if (!record) continue;
    if (await hasActiveReference(record)) {
      await NewsletterMedia.updateOne({ id: record.id, deletingAt: record.deletingAt }, { $unset: { deletingAt: '' } });
      continue;
    }
    try {
      await getR2Client().send(new DeleteObjectCommand({ Bucket: record.bucket, Key: record.storageKey }));
      await NewsletterMedia.deleteOne({ id: record.id, deletingAt: record.deletingAt });
      removed += 1;
    } catch {
      failed += 1;
      // Leave the lease to expire; a later runner retries without looping here.
    }
  }
  return { removed, failed, eligible, dryRun };
}
