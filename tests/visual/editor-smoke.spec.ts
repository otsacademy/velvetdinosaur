import { test, expect, type Page } from '@playwright/test';

const ATTACHMENT_DATA = {
  root: { props: { title: 'Home' } },
  content: [
    {
      type: 'Attachment',
      props: {
        id: 'vd_smoke_attachment',
        label: 'Download file',
        fileUrl: ''
      }
    }
  ]
};

const TEST_URL = 'https://example.com/smoke.pdf';
const SMOKE_TOKEN = process.env.VD_EDITOR_SMOKE_TOKEN || 'playwright';

async function seedAttachment(page: Page, slug: string) {
  await page.request.put(`/api/cms/pages/${encodeURIComponent(slug)}`, {
    data: JSON.stringify({ data: ATTACHMENT_DATA }),
    headers: {
      'Content-Type': 'application/json',
      'x-vd-editor-smoke': SMOKE_TOKEN
    }
  });
}

test('editor loads, asset picker opens, and draft persists', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const slug = `smoke-${testInfo.project.name}`;

  await seedAttachment(page, slug);
  await page.goto(`/edit/${encodeURIComponent(slug)}`, { waitUntil: 'domcontentloaded' });
  await page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url().includes(`/api/cms/pages/${encodeURIComponent(slug)}`)
  );

  await expect(page.getByRole('button', { name: 'Save draft' })).toBeVisible();

  await page.getByRole('button', { name: 'Outline' }).click();
  await page.getByText('Attachment').first().click();
  // Outline uses a modal sheet; close it so the bottom dock is clickable.
  await page.keyboard.press('Escape');
  // Properties is not guaranteed to auto-open after selection (users can close/pin it),
  // so explicitly open it for deterministic smoke coverage.
  await page.getByRole('button', { name: 'Properties' }).click();
  const urlInput = page.getByPlaceholder('Paste a URL, upload, or pick from library').first();
  await expect(urlInput).toBeVisible();

  await page.getByRole('button', { name: 'Browse' }).first().click();
  await expect(page.getByRole('dialog', { name: 'Asset library' })).toBeVisible();

  await urlInput.fill(TEST_URL);
  await expect(urlInput).toHaveValue(TEST_URL);
  const previewFrame = page.frameLocator('iframe');
  await expect(previewFrame.getByRole('link', { name: /Download file/i })).toHaveAttribute(
    'href',
    TEST_URL
  );

  // Properties panel may be pinned open; closing is not required for correctness.
  // Ensure it doesn't block draft persistence.
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page.getByText('Draft saved')).toBeVisible();

  await page.reload({ waitUntil: 'domcontentloaded' });
  const persisted = await page.request.get(`/api/cms/pages/${encodeURIComponent(slug)}`, {
    headers: {
      'x-vd-editor-smoke': SMOKE_TOKEN
    }
  });
  const persistedJson = await persisted.json();
  const persistedDraft = persistedJson?.draftData ?? null;
  expect(persistedDraft).not.toBeNull();
  const persistedText = JSON.stringify(persistedDraft ?? {});
  expect(persistedText).toContain(TEST_URL);

  expect(pageErrors).toEqual([]);
});

test('media library loads', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/edit/media', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Media Library')).toBeVisible();
  await expect(page.getByText('No uploads found.')).toBeVisible();

  expect(pageErrors).toEqual([]);
});
