import { test, expect, type Page } from '@playwright/test';

const routes = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'work', path: '/work' },
  { name: 'contact', path: '/contact' },
  { name: 'audit', path: '/audit' },
  { name: 'web-design-witney', path: '/web-design-witney' },
  { name: 'web-design-oxfordshire', path: '/web-design-oxfordshire' }
];

async function stabilize(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `
  });
  await page.evaluate(() => document.fonts.ready);
  // Images below the fold load lazily, and only near the viewport. Walk the
  // page once so the full-page snapshot always has every picture in it.
  await page.evaluate(async () => {
    for (let top = 0; top < document.documentElement.scrollHeight; top += window.innerHeight) {
      window.scrollTo({ top, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    await Promise.all(
      Array.from(document.images)
        .filter((image) => !image.complete)
        .map((image) => new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        }))
    );
  });
  await page.waitForLoadState('networkidle');
  // Let anything timer-driven settle before the snapshot.
  await page.waitForTimeout(1800);
}

test.describe('visual baselines', () => {
  for (const route of routes) {
    test(`${route.name} page`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route.path, { waitUntil: 'networkidle' });
      await stabilize(page);
      // The embedded map renders live tiles; mask it so it cannot flake the gate.
      await expect(page).toHaveScreenshot(`${route.name}.png`, {
        fullPage: true,
        mask: [page.locator('[data-map]')]
      });
    });
  }
});
