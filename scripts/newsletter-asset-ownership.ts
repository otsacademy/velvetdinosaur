import path from 'node:path';
import { readFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import { z } from 'zod';
import { assertNewsletterStorageEnvironment, readNewsletterEnvironment } from '@/lib/newsletter/operations';

const ManifestSchema = z.object({
  site: z.string().min(1),
  evidence: z.string().trim().min(20).max(2000),
  assets: z.array(z.object({ key: z.string().startsWith('uploads/'), sha256: z.string().regex(/^[a-f0-9]{64}$/),
    originalSha256: z.string().regex(/^[a-f0-9]{64}$/).optional() })).min(1).max(500)
});

async function main() {
  const args = process.argv.slice(2);
  const manifestPath = args.find((arg) => arg.startsWith('--manifest='))?.slice('--manifest='.length);
  if (!manifestPath) throw new Error('Provide --manifest=<reviewed-ownership.json>; this command never infers ownership from public backfilled records.');
  const manifest = ManifestSchema.parse(JSON.parse(await readFile(manifestPath, 'utf8')));
  const envPath = path.resolve(args.find((arg) => arg.startsWith('--env-file='))?.slice('--env-file='.length) || '.env.production');
  const env = await readNewsletterEnvironment(envPath);
  assertNewsletterStorageEnvironment(env);
  if (manifest.site !== (env.SITE_SLUG || env.VD_SITE_SLUG)) throw new Error('Ownership evidence is for a different site.');
  if (new Set(manifest.assets.map((asset) => asset.key)).size !== manifest.assets.length) throw new Error('The ownership manifest contains duplicate keys.');
  Object.assign(process.env, env);
  const { connectDB } = await import('@/lib/db');
  const { Asset } = await import('@/models/Asset');
  const { assetOwnerSite } = await import('@/lib/assets/ownership.server');
  const { readMediaBytes } = await import('@/lib/newsletter/media-storage');
  const { mediaChecksum } = await import('@/lib/newsletter/media-validation');
  if (!await connectDB()) throw new Error('The site database is unavailable.');
  const ownerSite = assetOwnerSite();
  const reviewed: Array<{ key: string; bucket: string; originalKey: string | null; ownerSite: string | null; updatedAt: Date | null }> = [];
  // Verify the complete manifest before making any ownership changes.
  for (const item of manifest.assets) {
    const asset = await Asset.findOne({ key: item.key, deletedAt: null }).lean() as { bucket?: string; ownerSite?: string; originalKey?: string; updatedAt?: Date } | null;
    if (!asset?.bucket) throw new Error(`No current-site library record exists for ${item.key}.`);
    if (asset.ownerSite && asset.ownerSite !== ownerSite) throw new Error(`Conflicting ownership for ${item.key}.`);
    if (mediaChecksum(await readMediaBytes(asset.bucket, item.key)) !== item.sha256) throw new Error(`The reviewed bytes have changed for ${item.key}.`);
    if (asset.originalKey) {
      if (!item.originalSha256 || mediaChecksum(await readMediaBytes(asset.bucket, asset.originalKey)) !== item.originalSha256) {
        throw new Error(`The private original must also have a reviewed checksum for ${item.key}.`);
      }
    }
    reviewed.push({ key: item.key, bucket: asset.bucket, originalKey: asset.originalKey || null,
      ownerSite: asset.ownerSite || null, updatedAt: asset.updatedAt || null });
  }
  if (args.includes('--apply')) {
    for (const item of reviewed) {
      const result = await Asset.updateOne({ ...item, deletedAt: null }, { $set: {
        ownerSite, ownershipSource: 'reviewed-migration', ownershipVerifiedAt: new Date(), ownershipEvidence: manifest.evidence
      } });
      if (result.matchedCount !== 1) throw new Error(`The library record changed during review for ${item.key}. Re-review before continuing; earlier verified entries remain applied.`);
    }
  }
  console.log(JSON.stringify({ site: manifest.site, verified: manifest.assets.length, applied: args.includes('--apply') }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Ownership verification failed.');
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
