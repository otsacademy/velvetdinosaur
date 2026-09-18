import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('demo uploads stay in the session library and survive saving and reopening a draft', async ({ page }) => {
  const liveRequests: string[] = [];
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.startsWith('/api/admin/newsletter/') || pathname.startsWith('/api/assets/')) liveRequests.push(`${request.method()} ${pathname}`);
  });
  await page.goto('/demo/newsletter', { waitUntil: 'networkidle' });
  await page.getByRole('dialog', { name: 'How the newsletter demo works', exact: true }).getByRole('button', { name: 'Close', exact: true }).first().click();
  await page.getByRole('button', { name: 'New draft', exact: true }).click();
  // The existing composer field labels are visual labels without an input association.
  await page.locator('input').filter({ visible: true }).first().fill('Uploaded newsletter draft');

  await page.locator('[data-slate-editor="true"] [data-slate-string="true"]').first().click();
  await page.keyboard.press('End');
  await page.getByRole('button', { name: 'Insert image', exact: true }).focus();
  await page.keyboard.press('Enter');
  const imagePicker = page.getByRole('dialog', { name: 'Choose newsletter image', exact: true });
  await expect(imagePicker).toBeVisible();
  await imagePicker.locator('input[type="file"]').setInputFiles({
    name: 'newsletter-upload-image.png', mimeType: 'image/png',
    buffer: await readFile('public/assets/demo-media/newsletter/sample.png')
  });
  await imagePicker.getByRole('button', { name: 'Upload', exact: true }).click();
  const imageDetails = page.getByRole('dialog', { name: 'Newsletter image', exact: true });
  await expect(imageDetails).toBeVisible();
  await imageDetails.getByLabel('Alternative text', { exact: true }).fill('Uploaded website preview');
  await imageDetails.getByLabel('Caption', { exact: true }).fill('A local upload saved with the draft');
  await imageDetails.getByRole('button', { name: 'Save image', exact: true }).click();
  const uploadedImage = page.getByRole('img', { name: 'Uploaded website preview', exact: true });
  await expect(uploadedImage).toBeVisible();
  await expect(uploadedImage).toHaveAttribute('src', /^blob:/);
  expect(await uploadedImage.evaluate((image) => image.closest('[data-slate-node="element"]')?.previousElementSibling?.textContent)).toContain('Hello {{firstName}}');

  await page.getByRole('button', { name: 'Add attachment', exact: true }).click();
  const attachmentPicker = page.getByRole('dialog', { name: 'Add attachment', exact: true });
  await attachmentPicker.locator('input[type="file"]').setInputFiles({
    name: 'newsletter-upload-document.pdf', mimeType: 'application/pdf',
    buffer: await readFile('public/assets/demo-media/newsletter/sample.pdf')
  });
  await attachmentPicker.getByRole('button', { name: 'Upload', exact: true }).click();
  const attachments = page.getByRole('region', { name: 'Newsletter attachments' });
  await expect(attachments).toContainText('newsletter-upload-document');
  await expect(attachments).toContainText('1/5 files');
  await expect(attachments.getByRole('link', { name: 'Preview source file newsletter-upload-document', exact: true })).toHaveAttribute('href', /^blob:/);
  await expect(attachments.getByRole('link', { name: 'Download source file newsletter-upload-document', exact: true })).toHaveAttribute('download', 'newsletter-upload-document');

  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await page.getByRole('button', { name: /^March Studio Notes/ }).click();
  await expect(uploadedImage).toHaveCount(0);
  await page.getByRole('button', { name: /^Uploaded newsletter draft/ }).click();
  await expect(uploadedImage).toBeVisible();
  await expect(attachments).toContainText('newsletter-upload-document');

  // Both uploads are reusable from the same session library, including the mixed PDF/image view.
  await page.getByRole('button', { name: 'Add attachment', exact: true }).click();
  await page.getByTestId('puck-asset-browse-newsletter-attachment').click();
  const library = page.getByRole('dialog', { name: 'Asset library', exact: true });
  await expect(library.getByText('newsletter-upload-image', { exact: true })).toBeVisible();
  await expect(library.getByText('newsletter-upload-document', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(library).not.toBeVisible();
  await expect(attachmentPicker).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(attachmentPicker).not.toBeVisible();
  await expect(attachments).toContainText('1/5 files');

  // Dismissing an image editor with the keyboard must leave the document unchanged.
  await page.getByRole('button', { name: 'Edit image', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(imageDetails).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(imageDetails).toContainText('Alternative text');
  expect(await imageDetails.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(imageDetails).not.toBeVisible();
  await expect(uploadedImage).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit image', exact: true })).toBeFocused();

  await page.getByRole('button', { name: 'Edit image', exact: true }).click();
  await imageDetails.getByLabel('Caption', { exact: true }).fill('Caption kept while replacing the image');
  await imageDetails.getByRole('button', { name: 'Replace image', exact: true }).click();
  await page.getByTestId('puck-asset-browse-newsletter-image').click();
  await page.getByTestId('asset-use-seed-newsletter-image').click();
  await expect(imageDetails.getByLabel('Caption', { exact: true })).toHaveValue('Caption kept while replacing the image');
  await imageDetails.getByRole('button', { name: 'Save image', exact: true }).click();
  await expect(uploadedImage).toHaveAttribute('src', '/assets/demo-media/newsletter/sample.png');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(uploadedImage).toHaveAttribute('src', /^blob:/);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(uploadedImage).toHaveAttribute('src', '/assets/demo-media/newsletter/sample.png');
  expect(liveRequests).toEqual([]);
});


test('switching composer views never repeats an inserted token', async ({ page }) => {
  await page.goto('/demo/newsletter', { waitUntil: 'networkidle' });
  await page.getByRole('dialog', { name: 'How the newsletter demo works', exact: true }).getByRole('button', { name: 'Close', exact: true }).first().click();
  await page.getByRole('button', { name: '{{email}}', exact: true }).click();
  const editor = page.locator('[data-slate-editor="true"]');
  await expect(editor).toContainText('{{email}}');
  const inserted = await editor.textContent();
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await page.getByRole('tab', { name: 'Editor', exact: true }).click();
  await expect(editor).toHaveText(inserted || '');
  await page.getByRole('button', { name: 'Show HTML & Plain Text', exact: true }).click();
  await page.getByRole('tab', { name: 'HTML', exact: true }).click();
  await page.getByRole('tab', { name: 'Editor', exact: true }).click();
  await expect(editor).toHaveText(inserted || '');
});
