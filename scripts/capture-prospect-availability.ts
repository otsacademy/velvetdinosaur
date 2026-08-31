import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const batchId = process.argv.find((arg) => arg.startsWith('--batch='))?.slice(8) || 'fourth-ten';
const requested = new Set(
  (process.argv.find((arg) => arg.startsWith('--sites='))?.slice(8) || '').split(',').filter(Boolean),
);
const batches = JSON.parse(
  await fs.readFile(new URL('prospect-harvest-batches.json', import.meta.url), 'utf8'),
) as Record<string, { output: string; sites: Array<{ id: string; name: string; origin: string; seeds?: string[] }> }>;
const batch = batches[batchId];
if (!batch) throw new Error(`Unknown batch: ${batchId}`);
const targets = requested.size ? batch.sites.filter((site) => requested.has(site.id)) : batch.sites;
if (targets.length !== requested.size && requested.size) throw new Error('One or more requested sites are unknown');

const root = path.resolve('output/playwright', batch.output);
const browser = await chromium.launch({ headless: true });
try {
  for (const site of targets) {
    const url = site.seeds?.[0] || site.origin;
    const availabilityDir = path.join(root, site.id, 'availability');
    await fs.mkdir(availabilityDir, { recursive: true });
    const records = [];
    for (const viewport of [
      { label: 'desktop', width: 1440, height: 1000 },
      { label: 'mobile', width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/145.0 Safari/537.36',
      });
      const page = await context.newPage();
      let status: number | null = null;
      let error = '';
      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        status = response?.status() ?? null;
        await page.waitForTimeout(8_000);
      } catch (caught) {
        error = caught instanceof Error ? caught.message : String(caught);
      }
      const title = await page.title().catch(() => '');
      const text = await page.locator('body').innerText().catch(() => '');
      const html = await page.content().catch(() => '');
      await page.screenshot({
        path: path.join(availabilityDir, `${viewport.label}-protection.png`),
        fullPage: true,
      });
      if (viewport.label === 'desktop') {
        await fs.writeFile(path.join(availabilityDir, 'availability.html'), html);
        await fs.writeFile(path.join(availabilityDir, 'availability.txt'), text);
      }
      records.push({
        viewport: viewport.label,
        sourceUrl: url,
        finalUrl: page.url(),
        capturedAt: new Date().toISOString(),
        status,
        title,
        text: text.slice(0, 2_000),
        error,
      });
      await context.close();
    }
    await fs.writeFile(
      path.join(availabilityDir, 'availability.json'),
      `${JSON.stringify({ site: site.id, name: site.name, records }, null, 2)}\n`,
    );
    console.log(`${site.id}: ${records.map((record) => `${record.viewport} ${record.status}`).join(', ')}`);
  }
} finally {
  await browser.close();
}
