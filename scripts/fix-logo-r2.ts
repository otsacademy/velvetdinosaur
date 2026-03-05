import dotenv from 'dotenv';
import { connectDB } from '@/lib/db';
import { Page } from '@/models/Page';
import { r2PublicUrl } from '@/lib/public-assets';

dotenv.config({ path: '.env.production' });

function deepReplace(input: unknown, from: string, to: string): { value: unknown; changed: boolean } {
  if (typeof input === 'string') {
    if (input === from) return { value: to, changed: true };
    return { value: input, changed: false };
  }
  if (!input || typeof input !== 'object') return { value: input, changed: false };
  if (Array.isArray(input)) {
    let changed = false;
    const next = input.map((item) => {
      const res = deepReplace(item, from, to);
      changed = changed || res.changed;
      return res.value;
    });
    return changed ? { value: next, changed } : { value: input, changed: false };
  }

  let changed = false;
  const obj = input as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const res = deepReplace(value, from, to);
    changed = changed || res.changed;
    next[key] = res.value;
  }
  return changed ? { value: next, changed } : { value: input, changed: false };
}

async function main() {
  await connectDB();

  const from = '/logo.webp';
  const to = r2PublicUrl('logo.webp');

  const pages = await Page.find({}).exec();
  let touched = 0;

  for (const page of pages) {
    let changed = false;

    const draft = deepReplace(page.draftData, from, to);
    if (draft.changed) {
      page.draftData = draft.value as any;
      changed = true;
    }

    const published = deepReplace(page.publishedData, from, to);
    if (published.changed) {
      page.publishedData = published.value as any;
      changed = true;
    }

    const legacy = deepReplace(page.data, from, to);
    if (legacy.changed) {
      page.data = legacy.value as any;
      changed = true;
    }

    if (changed) {
      await page.save();
      touched += 1;
      // Keep output stable and grep-friendly.
      console.log(`[fix-logo-r2] updated ${page.slug}`);
    }
  }

  console.log(`[fix-logo-r2] done (${touched} pages updated)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

