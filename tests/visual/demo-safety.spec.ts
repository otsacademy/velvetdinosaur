import { expect, test } from '@playwright/test';

const DISCLAIMER =
  "Unofficial website concept prepared privately by Velvet Dinosaur. This is not the business's current website.";

test('demo safety headers, disclaimer and public action guard match the site mode', async ({ page, request }) => {
  const response = await request.get('/');
  const headers = response.headers();
  const isDemo = headers['x-vd-demo-site'] === 'true';

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const banner = page.locator('[data-demo-safety-banner]');

  if (!isDemo) {
    await expect(banner).toHaveCount(0);
    return;
  }

  await expect(banner).toContainText(DISCLAIMER);
  await expect(banner).toBeVisible();
  const bannerBox = await banner.boundingBox();
  const viewport = page.viewportSize();
  expect(bannerBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(Math.abs((bannerBox?.y || 0) + (bannerBox?.height || 0) - (viewport?.height || 0))).toBeLessThanOrEqual(2);
  expect(headers['x-robots-tag']).toContain('noindex');
  expect(headers['x-robots-tag']).toContain('noarchive');
  expect(headers['cache-control']).toContain('no-store');
  expect(headers.pragma).toBe('no-cache');
  expect(headers.expires).toBe('0');

  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toMatch(/Disallow:\s*\//i);

  const contact = await request.post('/api/contact', {
    data: { email: 'demo-safety@example.invalid', message: 'This must never be delivered.' }
  });
  expect(contact.status()).toBe(409);
  expect(contact.headers()['x-vd-demo-blocked']).toBe('true');
  expect(await contact.json()).toMatchObject({ demo: true, code: 'DEMO_ACTION_DISABLED' });

  const signUp = await request.post('/api/auth/sign-up/email', {
    data: { email: 'demo-safety@example.invalid', password: 'not-a-real-password' }
  });
  expect(signUp.status()).toBe(409);
  expect(signUp.headers()['x-vd-demo-blocked']).toBe('true');

  await page.evaluate(() => {
    const form = document.createElement('form');
    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'Send enquiry';
    form.append(button);
    document.body.append(form);
    button.click();
  });
  await expect(banner).toContainText('Public enquiries, bookings, subscriptions, orders and payments are disabled.');
});

test('demo safety allows the real backend sign-in form to submit', async ({ page }) => {
  let signInSubmitted = false;
  await page.route('**/api/auth/sign-in/email', async (route) => {
    signInSubmitted = true;
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' })
    });
  });

  const homeResponse = await page.request.get('/');
  const isDemo = homeResponse.headers()['x-vd-demo-site'] === 'true';

  await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-demo-safety-banner]')).toHaveCount(0);
  if (isDemo) {
    await expect(page.getByRole('link', { name: 'Back to website preview' })).toHaveAttribute('href', '/');
    await expect(page.getByText('Secure editor access by Velvet Dinosaur')).toBeVisible();
  }
  await expect(page.getByLabel('Email')).toHaveAttribute('autocomplete', 'email');
  await expect(page.getByLabel('Password')).toHaveAttribute('autocomplete', 'current-password');
  await page.getByLabel('Email').fill('demo-login-check@example.invalid');
  await page.getByLabel('Password').fill('not-a-real-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect.poll(() => signInSubmitted).toBe(true);
  await expect(page.getByText(/invalid email or password/i)).toBeVisible();
});
