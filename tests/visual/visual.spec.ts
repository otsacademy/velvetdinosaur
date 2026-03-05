import { test, expect, type Page } from '@playwright/test';

const routes = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' }
];

async function stabilize(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
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
  await page.waitForTimeout(100);
}

test.describe('visual baselines', () => {
  for (const route of routes) {
    test(`${route.name} page`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'networkidle' });
      await stabilize(page);
      await expect(page).toHaveScreenshot(`${route.name}.png`, { fullPage: true });
    });
  }
});
