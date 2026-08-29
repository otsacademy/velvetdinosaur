import { expect, test, type Page } from '@playwright/test';

/**
 * The DB-less test runtime makes the /admin PPR resume mismatch its build-time
 * prerender (built with .env.production), so React re-renders the tree
 * client-side shortly after load, replacing DOM nodes and wiping interaction
 * state (details[open], focus, pending navigations). Pre-existing platform
 * condition — re-verify at the Next 16.2.11 upgrade. Until then, wait for the
 * tree to hold identity across consecutive polls before interacting.
 */
async function settleAfterHydration(page: Page) {
  await page.waitForFunction(
    () => {
      const w = window as unknown as { __vdStableMain?: { el: Element | null; count: number } };
      const current = document.querySelector('main');
      if (!w.__vdStableMain || w.__vdStableMain.el !== current) {
        w.__vdStableMain = { el: current, count: 0 };
        return false;
      }
      w.__vdStableMain.count += 1;
      return w.__vdStableMain.count >= 5;
    },
    undefined,
    { polling: 100, timeout: 15_000 }
  );
}

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
}

test.describe('protected administration', () => {
  test('admin hub links to the native fleet surface', async ({ page }, testInfo) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Administration', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Fleet status/ })).toHaveAttribute('href', '/admin/fleet');
    // Admin navigation now lives in the shared workspace shell: a labeled
    // sidebar on desktop, behind the menu trigger on mobile.
    if (testInfo.project.name === 'mobile') {
      await expect(page.getByRole('button', { name: 'Open admin navigation' })).toBeVisible();
    } else {
      await expect(page.getByRole('navigation', { name: 'Admin navigation' }).first()).toBeVisible();
    }
  });

  test('fleet is read-only, complete, filterable, and server proxied', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/admin/fleet', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Fleet status', level: 1 })).toBeVisible();
    await expect(page.getByText('Read-only').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Repositories' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Deployments' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Unmatched workloads' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Registry discrepancies' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Open exceptions' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Blockers' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Refresh status' })).toHaveAttribute('href', '/admin/fleet');

    const viewportFit = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));
    expect(viewportFit.scrollWidth).toBeLessThanOrEqual(viewportFit.clientWidth);

    await settleAfterHydration(page);
    // First Tab lands on the workspace shell's skip link, which jumps past the
    // sidebar to the content region.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#workspace-content')).toBeFocused();

    const firstSubject = page.locator('details').first();
    await expect(firstSubject).not.toHaveAttribute('open', '');
    await expect(async () => {
      await firstSubject.locator('summary').click();
      await expect(firstSubject).toHaveAttribute('open', '', { timeout: 1000 });
    }).toPass({ timeout: 10_000 });
    await expect(firstSubject.getByRole('columnheader', { name: 'Field' })).toBeVisible();

    const html = await page.content();
    expect(html).not.toContain('127.0.0.1:43001');
    expect(html).not.toContain('/admin/fleet/api/status');
    expect(await page.locator('form').count()).toBe(1);
    await expect(page.locator('form')).toHaveAttribute('method', 'get');
    expect(await page.locator('button[type="submit"]').count()).toBe(1);

    const searchbox = page.getByRole('searchbox', { name: 'Search fleet status' });
    await searchbox.fill('orphan');
    await searchbox.press('Enter');
    await expect(page).toHaveURL(/\/admin\/fleet\?q=orphan$/);
    await expect(page.getByText('Filtered by').first()).toBeVisible();
    await expect(page.getByText('vd-orphan-worker.service').first()).toBeVisible();
    await expect(page.getByText('No repositories match this view.')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Field' })).toBeVisible();
    await settleAfterHydration(page);
    await expect(async () => {
      await page.getByRole('link', { name: 'Clear' }).click();
      await expect(page).toHaveURL(/\/admin\/fleet$/, { timeout: 2000 });
    }).toPass({ timeout: 10_000 });
    await expect(page.getByText('No repositories match this view.')).toHaveCount(0);

    const repositoriesJump = page
      .getByRole('navigation', { name: 'Fleet sections' })
      .getByRole('link', { name: 'Repositories' });
    await repositoriesJump.click();
    await expect(page).toHaveURL(/#repositories$/);
    expect(pageErrors).toEqual([]);
  });

  test('fleet requires authentication without exposing status data', async ({ browser, baseURL }) => {
    const response = await fetch(new URL('/admin/fleet', baseURL), {
      redirect: 'manual',
      headers: { 'x-vd-editor-smoke': 'not-authorized' }
    });
    const body = await response.text();
    expect([200, 303, 307, 308]).toContain(response.status);
    expect(body).not.toContain('vd-orphan-worker.service');
    expect(body).not.toContain('Fleet summary');

    const context = await browser.newContext({
      baseURL,
      extraHTTPHeaders: { 'x-vd-editor-smoke': 'not-authorized' }
    });
    try {
      const page = await context.newPage();
      await page.goto('/admin/fleet', { waitUntil: 'domcontentloaded' });
      await page.waitForURL(/\/sign-in\?next=%2Fadmin%2Ffleet$/, { timeout: 10_000 });
    } finally {
      await context.close();
    }
  });

  test('fleet has stable light and dark visual baselines', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/admin/fleet', { waitUntil: 'domcontentloaded' });
    await stabilize(page);
    // The review-window chip renders a today-relative date range; mask it so
    // baselines do not rot daily.
    const reviewWindowChip = page.locator('button:has(.lucide-calendar-range)');
    await expect(page).toHaveScreenshot('fleet-light.png', { fullPage: true, mask: [reviewWindowChip] });

    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await stabilize(page);
    await expect(page).toHaveScreenshot('fleet-dark.png', { fullPage: true, mask: [reviewWindowChip] });

    testInfo.annotations.push({ type: 'accessibility', description: 'Landmarks, headings, labels, table headers, text-and-icon states, keyboard details, and 44px controls are asserted by structure and review.' });
  });
});
