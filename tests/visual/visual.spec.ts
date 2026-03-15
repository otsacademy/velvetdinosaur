import { test, expect, type Page } from '@playwright/test';

const routes = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' }
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
  // Let timer-driven hero and CTA reveals settle before the snapshot.
  await page.waitForTimeout(1800);
}

test.describe('visual baselines', () => {
  for (const route of routes) {
    test(`${route.name} page`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route.path, { waitUntil: 'networkidle' });
      await stabilize(page);
      await expect(page).toHaveScreenshot(`${route.name}.png`, { fullPage: true });
    });
  }
});
