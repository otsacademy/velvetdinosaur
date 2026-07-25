import { chromium } from '@playwright/test';
import path from 'node:path';

const OUT_DIR = '/srv/apps/velvetdinosaur/public/portfolio';

// 1440x654 = 2.2:1 — wide banner crop of the top of each live homepage,
// sized so the work-card cover (object-cover object-top) fits cleanly from
// mobile (~2.1:1) up to desktop (~3.2:1).
const SITES = [
  { name: 'asap', url: 'https://academicsstand.org' },
  { name: 'the-brave', url: 'https://thebrave.online' },
  { name: 'rising-dust', url: 'https://risingdustadventures.com' },
  { name: 'scholardemia', url: 'https://scholardemia.com' },
];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

  for (const site of SITES) {
    try {
      await page.goto(site.url, { waitUntil: 'networkidle', timeout: 45000 });
    } catch {
      console.warn(`[snap] ${site.name}: networkidle timeout, continuing with current state`);
    }
    // settle animations / late banners, then hide obvious cookie overlays
    await page.waitForTimeout(4000);
    await page.evaluate(() => {
      const selectors = [
        '[id*="cookie" i]', '[class*="cookie" i]', '[id*="consent" i]', '[class*="consent" i]',
        '[aria-label*="cookie" i]', '#CybotCookiebotDialog', '.cc-window',
      ];
      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.height > 40 && rect.height < window.innerHeight) {
            (el as HTMLElement).style.display = 'none';
          }
        });
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, `${site.name}.png`),
      clip: { x: 0, y: 0, width: 1440, height: 654 },
    });
    console.log(`[snap] saved ${site.name}.png`);
  }

  await browser.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
