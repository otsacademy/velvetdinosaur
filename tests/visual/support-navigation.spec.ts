import { expect, test, type Page } from '@playwright/test';

const EMPTY_OVERVIEW = {
  totals: {
    total: 0,
    requiringOurInput: 0,
    requiringYourInput: 0,
    open: 0,
    closed: 0
  },
  monthly: [],
  categories: [],
  recentTickets: []
};

async function mockSupportReads(page: Page) {
  await page.route('**/api/admin/support/**', async (route) => {
    const url = new URL(route.request().url());
    const payload = url.pathname.endsWith('/overview')
      ? EMPTY_OVERVIEW
      : url.pathname.endsWith('/tickets')
        ? { items: [] }
        : {};

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload)
    });
  });
}

async function mockProfile(page: Page, isAdmin: boolean) {
  await page.route('**/api/account/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        userId: 'editor-smoke',
        email: 'editor-smoke@local',
        isAdmin,
        canManageReviewMode: false
      })
    });
  });
}

test('administrator reaches the Customer Portal from the editor shell without console errors', async ({ page }, testInfo) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await mockProfile(page, true);
  await mockSupportReads(page);

  await page.goto('/edit', { waitUntil: 'domcontentloaded' });

  if (testInfo.project.name.toLowerCase().includes('mobile')) {
    await page.getByRole('button', { name: 'Open admin navigation' }).click();
  }

  const adminNavigation = page.getByRole('navigation', { name: 'Admin navigation' });
  const portalLink = adminNavigation.getByRole('link', { name: 'Customer Portal' });
  await expect(portalLink).toBeVisible({ timeout: 15_000 });
  await expect(portalLink).toHaveAttribute('href', '/edit/support');
  await portalLink.click();

  await expect(page).toHaveURL(/\/edit\/support$/);
  await expect(page.getByRole('heading', { name: 'Customer Portal', level: 1 })).toBeVisible();
  await page.waitForTimeout(500);
  expect(browserErrors).toEqual([]);
});

test('Customer Portal stays hidden for a non-admin profile on forced admin routes', async ({ page }, testInfo) => {
  await mockProfile(page, false);
  const profileResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname === '/api/account/profile'
  );
  await page.goto('/admin/users', { waitUntil: 'domcontentloaded' });
  await profileResponse;

  if (testInfo.project.name.toLowerCase().includes('mobile')) {
    await page.getByRole('button', { name: 'Open admin navigation' }).click();
  }

  const adminNavigation = page.getByRole('navigation', { name: 'Admin navigation' });
  await expect(adminNavigation.getByRole('link', { name: 'Customer Portal' })).toHaveCount(0);
});

test('email templates render without a Server Components failure', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await mockProfile(page, true);

  const response = await page.goto('/edit/contact-templates', { waitUntil: 'domcontentloaded' });

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Email Templates', level: 1 })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("This page couldn’t load")).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(browserErrors).toEqual([]);
});

test('review controls do not repeat the capability request already resolved by the profile', async ({ page }) => {
  let capabilityRequests = 0;
  await page.route('**/api/account/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        userId: 'editor-smoke',
        email: 'editor-smoke@local',
        isAdmin: true,
        canManageReviewMode: true
      })
    });
  });
  await page.route('**/api/admin/review-links?mode=capability', async (route) => {
    capabilityRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ canManageReviewLinks: true })
    });
  });

  await page.goto('/edit', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Review mode').first()).toBeAttached({ timeout: 15_000 });
  await page.waitForTimeout(500);

  expect(capabilityRequests).toBe(0);
});
