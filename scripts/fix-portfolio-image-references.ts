import { connectDB } from '../lib/db';
import { normalizePortfolioImageSrc } from '../lib/portfolio-images';
import type { ObjectId } from 'mongodb';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const dryRun = process.argv.includes('--dry-run');
type MongoConnection = NonNullable<Awaited<ReturnType<typeof connectDB>>>;

function normalizeValue(value: unknown, path: string[] = []): unknown {
  if (typeof value === 'string') {
    const lastKey = path[path.length - 1]?.toLowerCase() || '';
    const role = lastKey.includes('hero') ? 'hero' : 'card';
    return normalizePortfolioImageSrc(value, role);
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => normalizeValue(item, [...path, String(index)]));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, JsonValue>).map(([key, item]) => [
        key,
        normalizeValue(item, [...path, key]),
      ]),
    );
  }

  return value;
}

function changed(before: unknown, after: unknown) {
  return JSON.stringify(before) !== JSON.stringify(after);
}

async function fixWorkArticles(conn: MongoConnection) {
  const collection = conn.connection.collection('workarticles');
  const rows = (await collection
    .find({}, { projection: { slug: 1, img: 1, content: 1 } })
    .toArray()) as Array<{ _id: ObjectId; slug?: string; img?: string; content?: unknown }>;
  let count = 0;

  for (const row of rows) {
    const nextImg = normalizePortfolioImageSrc(row.img, 'card');
    const nextContent = normalizeValue(row.content);
    const update: Record<string, unknown> = {};

    if (nextImg !== row.img) update.img = nextImg;
    if (changed(row.content, nextContent)) update.content = nextContent;

    if (Object.keys(update).length) {
      count += 1;
      console.log(`${dryRun ? 'would update' : 'updating'} WorkArticle ${row.slug || row._id}`);
      if (!dryRun) {
        await collection.updateOne({ _id: row._id }, { $set: update });
      }
    }
  }

  return count;
}

async function fixPages(conn: MongoConnection) {
  const collection = conn.connection.collection('pages');
  const rows = (await collection
    .find({}, { projection: { slug: 1, data: 1, draftData: 1, publishedData: 1 } })
    .toArray()) as Array<{
    _id: ObjectId;
    slug?: string;
    data?: unknown;
    draftData?: unknown;
    publishedData?: unknown;
  }>;
  let count = 0;

  for (const row of rows) {
    const update: Record<string, unknown> = {};

    for (const field of ['data', 'draftData', 'publishedData'] as const) {
      const next = normalizeValue(row[field]);
      if (changed(row[field], next)) update[field] = next;
    }

    if (Object.keys(update).length) {
      count += 1;
      console.log(`${dryRun ? 'would update' : 'updating'} Page ${row.slug || row._id}`);
      if (!dryRun) {
        await collection.updateOne({ _id: row._id }, { $set: update });
      }
    }
  }

  return count;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.log('MONGODB_URI is not set; nothing to update.');
    return;
  }

  const conn = await connectDB();
  if (!conn) {
    console.log('MongoDB unavailable; nothing to update.');
    return;
  }

  const [workCount, pageCount] = await Promise.all([fixWorkArticles(conn), fixPages(conn)]);
  console.log(`${dryRun ? 'Dry run complete' : 'Portfolio image references fixed'}: ${workCount} work articles, ${pageCount} pages.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
