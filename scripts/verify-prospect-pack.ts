import fs from 'node:fs/promises';
import path from 'node:path';

const batchId = process.argv.find((arg) => arg.startsWith('--batch='))?.slice(8) || 'fourth-ten';
const batches = JSON.parse(
  await fs.readFile(new URL('prospect-harvest-batches.json', import.meta.url), 'utf8'),
) as Record<string, { output: string; sites: Array<{ id: string }> }>;
const batch = batches[batchId];
if (!batch) throw new Error(`Unknown batch: ${batchId}`);
const root = path.resolve('output/playwright', batch.output);
const failures: string[] = [];
const totals = { sites: batch.sites.length, pages: 0, assets: 0, assetsOk: 0, assetBytes: 0, availabilityScreenshots: 0, listingScreenshots: 0 };

async function filesBelow(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesBelow(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

for (const site of batch.sites) {
  const siteDir = path.join(root, site.id);
  const selected = JSON.parse(await fs.readFile(path.join(siteDir, 'inventory/selected-pages.json'), 'utf8')) as unknown[];
  const pages = JSON.parse(await fs.readFile(path.join(siteDir, 'inventory/captured-pages.json'), 'utf8')) as Array<{ fileBase: string; error?: string }>;
  const assets = JSON.parse(await fs.readFile(path.join(siteDir, 'inventory/assets.json'), 'utf8')) as Array<{ ok: boolean; bytes?: number; localPath?: string; error?: string }>;
  if (selected.length !== pages.length) failures.push(`${site.id}: ${selected.length} selected but ${pages.length} page records`);
  const expected = new Set<string>();
  for (const page of pages) {
    if (page.error) failures.push(`${site.id}: page error: ${page.error}`);
    for (const relative of [
      `pages/html/${page.fileBase}.html`,
      `pages/json/${page.fileBase}.json`,
      `pages/text/${page.fileBase}.txt`,
      `screenshots/desktop/${page.fileBase}.png`,
      `screenshots/mobile/${page.fileBase}.png`,
    ]) {
      expected.add(relative);
      const size = await fs.stat(path.join(siteDir, relative)).then((stat) => stat.size).catch(() => -1);
      if (size <= 0) failures.push(`${site.id}: missing/empty ${relative}`);
    }
  }
  for (const asset of assets) {
    if (!asset.ok || !asset.localPath) continue;
    expected.add(asset.localPath);
    const size = await fs.stat(path.join(siteDir, asset.localPath)).then((stat) => stat.size).catch(() => -1);
    if (size !== asset.bytes) failures.push(`${site.id}: asset byte mismatch ${asset.localPath}`);
  }
  const managed = (
    await Promise.all(['pages', 'screenshots', 'assets'].map((directory) => filesBelow(path.join(siteDir, directory))))
  ).flat().map((file) => path.relative(siteDir, file));
  for (const relative of managed) if (!expected.has(relative)) failures.push(`${site.id}: stale/unlisted ${relative}`);
  const availability = await filesBelow(path.join(siteDir, 'availability'));
  if (availability.length) {
    for (const required of ['availability.html', 'availability.txt', 'availability.json', 'desktop-protection.png', 'mobile-protection.png']) {
      if (!availability.includes(path.join(siteDir, 'availability', required))) failures.push(`${site.id}: missing availability/${required}`);
    }
    totals.availabilityScreenshots += 2;
  }
  const listing = await filesBelow(path.join(siteDir, 'listing'));
  if (listing.length) {
    for (const required of [
      'google-maps.json',
      'desktop-google-maps.html',
      'desktop-google-maps.txt',
      'desktop-google-maps.png',
      'mobile-google-maps.html',
      'mobile-google-maps.txt',
      'mobile-google-maps.png',
    ]) {
      if (!listing.includes(path.join(siteDir, 'listing', required))) failures.push(`${site.id}: missing listing/${required}`);
    }
    totals.listingScreenshots += 2;
  }
  totals.pages += pages.filter((page) => !page.error).length;
  totals.assets += assets.length;
  totals.assetsOk += assets.filter((asset) => asset.ok).length;
  totals.assetBytes += assets.reduce((sum, asset) => sum + Number(asset.bytes || 0), 0);
}

console.log(JSON.stringify({ ok: failures.length === 0, totals, failures }, null, 2));
if (failures.length) process.exitCode = 1;
