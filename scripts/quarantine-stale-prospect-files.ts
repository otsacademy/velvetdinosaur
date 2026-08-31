import fs from 'node:fs/promises';
import path from 'node:path';

const batchId = process.argv.find((arg) => arg.startsWith('--batch='))?.slice(8) || 'fourth-ten';
const batches = JSON.parse(
  await fs.readFile(new URL('prospect-harvest-batches.json', import.meta.url), 'utf8'),
) as Record<string, { output: string; sites: Array<{ id: string }> }>;
const batch = batches[batchId];
if (!batch) throw new Error(`Unknown batch: ${batchId}`);
const root = path.resolve('output/playwright', batch.output);
const quarantine = path.resolve(
  process.argv.find((arg) => arg.startsWith('--quarantine='))?.slice(13) ||
    `output/playwright/.quarantine/${batch.output}-stale`,
);

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

let moved = 0;
for (const site of batch.sites) {
  const siteDir = path.join(root, site.id);
  const pages = JSON.parse(
    await fs.readFile(path.join(siteDir, 'inventory/captured-pages.json'), 'utf8'),
  ) as Array<{ fileBase: string; error?: string }>;
  const assets = JSON.parse(
    await fs.readFile(path.join(siteDir, 'inventory/assets.json'), 'utf8'),
  ) as Array<{ ok: boolean; localPath?: string }>;
  const expected = new Set<string>();
  for (const page of pages.filter((entry) => !entry.error)) {
    expected.add(`pages/html/${page.fileBase}.html`);
    expected.add(`pages/json/${page.fileBase}.json`);
    expected.add(`pages/text/${page.fileBase}.txt`);
    expected.add(`screenshots/desktop/${page.fileBase}.png`);
    expected.add(`screenshots/mobile/${page.fileBase}.png`);
  }
  for (const asset of assets) if (asset.ok && asset.localPath) expected.add(asset.localPath);
  for (const managedRoot of ['pages', 'screenshots', 'assets']) {
    for (const absolute of await filesBelow(path.join(siteDir, managedRoot))) {
      const relative = path.relative(siteDir, absolute);
      if (expected.has(relative)) continue;
      const destination = path.join(quarantine, site.id, relative);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.rename(absolute, destination);
      console.log(`${site.id}: ${relative}`);
      moved += 1;
    }
  }
}
console.log(`Quarantined ${moved} stale files at ${quarantine}`);
