import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

type Site = { id: string; name: string; mapQuery?: string };
const batchId = process.argv.find((arg) => arg.startsWith('--batch='))?.slice(8) || 'fourth-ten';
const batches = JSON.parse(
  await fs.readFile(new URL('prospect-harvest-batches.json', import.meta.url), 'utf8'),
) as Record<string, { output: string; sites: Site[] }>;
const batch = batches[batchId];
if (!batch) throw new Error(`Unknown batch: ${batchId}`);
const sites = batch.sites.filter((site) => site.mapQuery);
const root = path.resolve('output/playwright', batch.output);
const browser = await chromium.launch({ headless: true });
try {
  for (const site of sites) {
    const listingDir = path.join(root, site.id, 'listing');
    await fs.mkdir(listingDir, { recursive: true });
    const records = [];
    for (const viewport of [
      { label: 'desktop', width: 1440, height: 1000 },
      { label: 'mobile', width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        locale: 'en-GB',
      });
      const page = await context.newPage();
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(site.mapQuery || '')}?hl=en&gl=uk`;
      let status: number | null = null;
      let error = '';
      try {
        const response = await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        status = response?.status() ?? null;
        const reject = page.getByRole('button', { name: /Reject all|Hylkää kaikki/i });
        if (await reject.count()) await reject.click();
        await page.waitForTimeout(10_000);
      } catch (caught) {
        error = caught instanceof Error ? caught.message : String(caught);
      }
      const title = await page.title().catch(() => '');
      const text = await page.locator('body').innerText().catch(() => '');
      const html = await page.content().catch(() => '');
      await page.screenshot({ path: path.join(listingDir, `${viewport.label}-google-maps.png`), fullPage: true });
      await fs.writeFile(path.join(listingDir, `${viewport.label}-google-maps.html`), html);
      await fs.writeFile(path.join(listingDir, `${viewport.label}-google-maps.txt`), text);
      records.push({
        viewport: viewport.label,
        searchUrl,
        finalUrl: page.url(),
        capturedAt: new Date().toISOString(),
        status,
        title,
        text: text.slice(0, 4_000),
        error,
      });
      await context.close();
    }
    await fs.writeFile(
      path.join(listingDir, 'google-maps.json'),
      `${JSON.stringify({ site: site.id, name: site.name, mapQuery: site.mapQuery, records }, null, 2)}\n`,
    );
    console.log(`${site.id}: ${records.map((record) => `${record.viewport} ${record.title}`).join(' | ')}`);
  }
} finally {
  await browser.close();
}
