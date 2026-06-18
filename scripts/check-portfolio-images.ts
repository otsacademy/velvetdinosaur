import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

import { WORK_FIXTURES } from '../lib/work-fixtures';
import { connectDB } from '../lib/db';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const LIMITS = {
  card: {
    maxBytes: 250 * 1024,
    maxWidth: 900,
    maxHeight: 900,
  },
  hero: {
    maxBytes: 500 * 1024,
    maxWidth: 1440,
    maxHeight: 1100,
  },
  snapshot: {
    maxBytes: 250 * 1024,
    maxWidth: 1200,
    maxHeight: 1100,
  },
} as const;

type ImageRole = keyof typeof LIMITS;

type PortfolioImageReference = {
  role: ImageRole;
  src: string;
  owner: string;
};

function isPortfolioAsset(src: string | undefined): src is string {
  return Boolean(src?.startsWith('/portfolio/'));
}

function toFilePath(src: string) {
  const pathname = src.split(/[?#]/)[0] || '';
  return path.join(ROOT, 'public', pathname);
}

async function collectDatabaseReferences(): Promise<PortfolioImageReference[]> {
  if (!process.env.MONGODB_URI) return [];

  const conn = await connectDB();
  if (!conn) return [];

  const rows = (await conn.connection
    .collection('workarticles')
    .find({}, { projection: { slug: 1, img: 1, content: 1 } })
    .toArray()) as Array<{ slug?: string; img?: string; content?: { heroImg?: string } }>;

  const references: PortfolioImageReference[] = [];

  for (const row of rows) {
    const slug = row.slug || 'work-article';
    if (isPortfolioAsset(row.img)) {
      references.push({
        role: 'card',
        src: row.img,
        owner: `db:${slug}.img`,
      });
    }
    if (isPortfolioAsset(row.content?.heroImg)) {
      references.push({
        role: 'hero',
        src: row.content.heroImg,
        owner: `db:${slug}.content.heroImg`,
      });
    }
  }

  return references;
}

function collectFixtureReferences(): PortfolioImageReference[] {
  const references: PortfolioImageReference[] = [];

  for (const article of WORK_FIXTURES) {
    if (isPortfolioAsset(article.img)) {
      references.push({
        role: 'card',
        src: article.img,
        owner: `${article.slug}.img`,
      });
    }

    if (isPortfolioAsset(article.content.heroImg)) {
      references.push({
        role: 'hero',
        src: article.content.heroImg,
        owner: `${article.slug}.content.heroImg`,
      });
    }

    const snapshotSrc = article.pageSpeedSnapshot?.image.src;
    if (isPortfolioAsset(snapshotSrc)) {
      references.push({
        role: 'snapshot',
        src: snapshotSrc,
        owner: `${article.slug}.pageSpeedSnapshot.image.src`,
      });
    }
  }

  return references;
}

async function checkReference(reference: PortfolioImageReference) {
  const filePath = toFilePath(reference.src);
  const extension = path.extname(filePath).toLowerCase();
  const limit = LIMITS[reference.role];
  const errors: string[] = [];

  if (extension !== '.webp' && extension !== '.avif') {
    errors.push(`${reference.owner} uses ${extension || 'no extension'}; use generated WebP/AVIF portfolio derivatives.`);
  }

  const [fileStat, metadata] = await Promise.all([stat(filePath), sharp(filePath).metadata()]);
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (fileStat.size > limit.maxBytes) {
    errors.push(
      `${reference.owner} is ${Math.round(fileStat.size / 1024)}KB; limit is ${Math.round(limit.maxBytes / 1024)}KB.`,
    );
  }

  if (width > limit.maxWidth || height > limit.maxHeight) {
    errors.push(
      `${reference.owner} is ${width}x${height}; limit is ${limit.maxWidth}x${limit.maxHeight}.`,
    );
  }

  return {
    ...reference,
    bytes: fileStat.size,
    width,
    height,
    errors,
  };
}

async function main() {
  const references = [
    ...collectFixtureReferences(),
    ...(await collectDatabaseReferences()),
  ];
  const results = await Promise.all(references.map((reference) => checkReference(reference)));
  const failures = results.flatMap((result) => result.errors);

  if (failures.length) {
    console.error('Portfolio image check failed:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  for (const result of results) {
    console.log(
      `${result.owner}: ${result.src} ${result.width}x${result.height} ${Math.round(result.bytes / 1024)}KB`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
