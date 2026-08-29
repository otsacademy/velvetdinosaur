import { test, expect, type Page } from '@playwright/test';

const editorSmokeRun = process.env.VD_PLAYWRIGHT_EDITOR_SMOKE === '1';

async function expectHealthyDesign(page: Page, path: string) {
  const imageFailures: string[] = [];
  page.on('response', (response) => {
    if (response.request().resourceType() === 'image' && !response.ok()) imageFailures.push(response.url());
  });
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-site-design-frame]')).toBeVisible({ timeout: 15_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const imageSources = await page.locator('img').evaluateAll((images) => [
    ...new Set(images.map((image) => {
      const htmlImage = image as HTMLImageElement;
      return htmlImage.currentSrc || htmlImage.src;
    }).filter(Boolean))
  ]);
  for (const source of imageSources) {
    const response = await page.request.get(source);
    expect(response.ok(), `${response.status()} ${source}`).toBe(true);
    expect(response.headers()['content-type'], source).toMatch(/^image\//);
  }
  expect(imageFailures).toEqual([]);
}

test('published page uses the site design frame with healthy images', async ({ page }) => {
  test.skip(editorSmokeRun, 'Published pages are verified against the real site database.');
  const response = await page.request.get('/');
  test.skip(response.headers()['x-vd-demo-site'] !== 'true', 'The bespoke demo design-frame gate applies only to demo sites.');
  await expectHealthyDesign(page, '/');
});

test('authenticated preview uses the site design frame with healthy images', async ({ page }) => {
  test.skip(!editorSmokeRun, 'Authenticated previews use the isolated editor smoke runtime.');
  const response = await page.request.get('/');
  test.skip(response.headers()['x-vd-demo-site'] !== 'true', 'The bespoke demo design-frame gate applies only to demo sites.');
  await expectHealthyDesign(page, '/preview/home');
});
