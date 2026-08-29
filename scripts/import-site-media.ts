import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { connectDB } from '@/lib/db';
import { getR2Client } from '@/lib/r2';
import { storeAssetWithVariants } from '@/lib/assets/image-pipeline.server';
import { Asset } from '@/models/Asset';
import { Page } from '@/models/Page';

const IMAGE_MIME: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

type ImportedMedia = {
  publicPath: string;
  assetUrl: string;
};

async function listFiles(root: string, relative = ''): Promise<string[]> {
  const directory = path.join(root, relative);
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(root, next)));
    if (entry.isFile() && IMAGE_MIME[path.extname(entry.name).toLowerCase()]) files.push(next);
  }
  return files.sort();
}

function safeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '') || 'site';
}

function labelFromFilename(filename: string) {
  return path.basename(filename, path.extname(filename)).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function replaceMediaReferences(value: unknown, replacements: Map<string, string>): unknown {
  if (typeof value === 'string') return replacements.get(value) || value;
  if (Array.isArray(value)) return value.map((item) => replaceMediaReferences(item, replacements));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      replaceMediaReferences(item, replacements)
    ])
  );
}

function countLegacyReferences(value: unknown): number {
  if (typeof value === 'string') {
    return value.startsWith('/demo-photos/') || value.startsWith('/design-assets/') ? 1 : 0;
  }
  if (Array.isArray(value)) return value.reduce((total, item) => total + countLegacyReferences(item), 0);
  if (!value || typeof value !== 'object') return 0;
  return Object.values(value as Record<string, unknown>).reduce<number>(
    (total, item) => total + countLegacyReferences(item),
    0
  );
}

async function importFile(root: string, relative: string, siteSlug: string, bucket: string): Promise<ImportedMedia> {
  const sourcePath = path.join(root, relative);
  const body = await readFile(sourcePath);
  const extension = path.extname(relative).toLowerCase();
  const mime = IMAGE_MIME[extension];
  const digest = createHash('sha256').update(body).digest('hex').slice(0, 20);
  const base = safeSlug(labelFromFilename(relative));
  const publicKey = `uploads/site-media/${siteSlug}/${base}-${digest}${extension}`;
  const originalKey = `asset-originals/site-media/${siteSlug}/${base}-${digest}${extension}`;
  const stored = await storeAssetWithVariants({
    client: getR2Client(),
    bucket,
    publicKey,
    originalKey,
    body,
    contentType: mime
  });
  const label = labelFromFilename(relative);

  await Asset.findOneAndUpdate(
    { key: stored.key },
    {
      key: stored.key,
      bucket,
      folder: 'site-media',
      name: label,
      alt: label,
      altSource: 'manual',
      altNeedsReview: false,
      mime: stored.mime,
      size: stored.size,
      width: stored.width,
      height: stored.height,
      etag: stored.etag,
      variants: stored.variants
    },
    { upsert: true, new: true }
  );

  return {
    publicPath: `/${relative.split(path.sep).join('/')}`,
    assetUrl: `/api/assets/file?key=${encodeURIComponent(stored.key)}`
  };
}

async function main() {
  const checkOnly = process.argv.includes('--check');
  const apply = process.argv.includes('--apply');
  if (!checkOnly && !apply) throw new Error('Use --apply to import media or --check to validate it.');

  const siteSlug = safeSlug(process.env.SITE_SLUG || process.env.VD_SITE_SLUG || path.basename(process.cwd()));
  const mediaRoot = path.join(process.cwd(), 'public');
  const files = (
    await Promise.all(
      ['demo-photos', 'design-assets'].map(async (directory) =>
        (await listFiles(path.join(mediaRoot, directory))).map((relative) =>
          path.join(directory, relative)
        )
      )
    )
  ).flat();
  const db = await connectDB();
  if (!db) throw new Error('Database connection not available.');

  if (checkOnly) {
    const pages = await Page.find({}).lean();
    const legacyReferences = pages.reduce(
      (total, page) =>
        total +
        countLegacyReferences(page.draftData) +
        countLegacyReferences(page.publishedData) +
        countLegacyReferences(page.data),
      0
    );
    const assetCount = await Asset.countDocuments({ folder: 'site-media', deletedAt: null });
    console.log(JSON.stringify({ siteSlug, sourceFiles: files.length, assetCount, legacyReferences }));
    if (legacyReferences > 0 || assetCount < files.length) process.exitCode = 1;
    return;
  }

  const bucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('R2_BUCKET not set.');
  const imported = await Promise.all(files.map((file) => importFile(mediaRoot, file, siteSlug, bucket)));
  const replacements = new Map(imported.map((item) => [item.publicPath, item.assetUrl]));
  const pages = await Page.find({});
  let updatedPages = 0;
  for (const page of pages) {
    const nextDraft = replaceMediaReferences(page.draftData, replacements);
    const nextPublished = replaceMediaReferences(page.publishedData, replacements);
    const nextLegacy = replaceMediaReferences(page.data, replacements);
    const changed =
      JSON.stringify(nextDraft) !== JSON.stringify(page.draftData) ||
      JSON.stringify(nextPublished) !== JSON.stringify(page.publishedData) ||
      JSON.stringify(nextLegacy) !== JSON.stringify(page.data);
    if (!changed) continue;
    await Page.updateOne(
      { _id: page._id },
      { $set: { draftData: nextDraft, publishedData: nextPublished, data: nextLegacy } }
    );
    updatedPages += 1;
  }

  console.log(JSON.stringify({ siteSlug, importedAssets: imported.length, updatedPages }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = await import('mongoose');
    await mongoose.default.disconnect();
  });
