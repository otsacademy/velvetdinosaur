import { expect, test, type Locator, type Page } from '@playwright/test';

const SMOKE_TOKEN = process.env.VD_EDITOR_SMOKE_TOKEN || 'playwright';
const DIRECT_EDIT_DATA = {
  root: { props: { title: 'Direct editing' } },
  content: [
    {
      type: 'Text',
      props: {
        id: 'vd_smoke_direct_text',
        heading: 'Edit this heading',
        body: 'Edit this body',
        layout: { marginTop: 180 }
      }
    },
    {
      type: 'Image',
      props: {
        id: 'vd_smoke_direct_image',
        src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="500"%3E%3Crect width="800" height="500" fill="%23ddd"/%3E%3C/svg%3E',
        alt: 'Direct edit test image',
        caption: 'Direct edit test caption'
      }
    }
  ]
};

test.use({
  extraHTTPHeaders: {
    'x-vd-editor-smoke': SMOKE_TOKEN
  }
});

async function seedDirectEdit(page: Page, slug: string) {
  const response = await page.request.put(`/api/cms/pages/${encodeURIComponent(slug)}`, {
    data: JSON.stringify({ data: DIRECT_EDIT_DATA }),
    headers: {
      'Content-Type': 'application/json',
      'x-vd-editor-smoke': SMOKE_TOKEN
    }
  });
  expect(response.ok()).toBe(true);
}

async function clickWithPointer(locator: Locator, touch: boolean) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const position = { x: box.width / 2, y: box.height / 2 };
  if (touch) await locator.tap({ position });
  else await locator.click({ position });
}

async function waitForEditorReady(page: Page) {
  await expect(page.locator('[data-puck-preview]')).toBeVisible({ timeout: 30_000 });
  await expect(page.frameLocator('iframe').first().locator('[data-site-design-frame]')).toBeVisible({
    timeout: 30_000
  });
  const dismiss = page.getByRole('button', { name: /dismiss getting started/i });
  if (await dismiss.isVisible().catch(() => false)) await dismiss.click();
  await expect(page.getByRole('button', { name: /^Save$/ })).toBeVisible({ timeout: 10_000 });
}

async function closeActiveEditorPanels(page: Page) {
  const activePanel = page.locator('[data-slot="menu-dock-item"][data-active="true"]');
  for (let attempt = 0; attempt < 3 && (await activePanel.count()) > 0; attempt += 1) {
    await activePanel.first().click({ force: true });
  }
  await page.keyboard.press('Escape');
}

test('inline text and direct image controls persist on desktop and mobile', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem('vd:asap-editor:getting-started:dismissed:v1', '1');
  });

  const slug = `smoke-direct-${testInfo.project.name}`;
  const touch = testInfo.project.name.toLowerCase().includes('mobile');
  await seedDirectEdit(page, slug);
  await page.goto(`/edit/pages/${encodeURIComponent(slug)}`, { waitUntil: 'domcontentloaded' });
  await waitForEditorReady(page);

  const preview = page.frameLocator('iframe').first();
  const editableText = preview.locator('[data-puck-component="vd_smoke_direct_text"] [contenteditable]');
  const heading = editableText.nth(0);
  const body = editableText.nth(1);

  await clickWithPointer(heading, touch);
  await expect(heading).toHaveAttribute('contenteditable', 'plaintext-only');
  await heading.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await heading.pressSequentially('Edited directly');

  await clickWithPointer(body, touch);
  await expect(body).toHaveAttribute('contenteditable', 'plaintext-only');
  await body.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await body.pressSequentially('Edited body directly');

  const image = preview.locator('[data-puck-component="vd_smoke_direct_image"] img').first();
  await image.scrollIntoViewIfNeeded();
  await closeActiveEditorPanels(page);
  await clickWithPointer(image, touch);
  const imageToolbar = page.locator('[data-vd-image-toolbar]');
  await expect(imageToolbar.getByRole('button', { name: 'Replace', exact: true })).toBeVisible();
  await expect(imageToolbar.getByRole('button', { name: 'Resize image' })).toBeVisible();
  await expect(imageToolbar.getByRole('spinbutton', { name: 'Image width percent' })).toBeVisible();
  await imageToolbar.getByRole('button', { name: 'Crop' }).click();
  await imageToolbar.getByRole('button', { name: '1/1' }).click();
  await imageToolbar.getByRole('button', { name: 'Align image right' }).click();

  if (touch) {
    const widthInput = imageToolbar.getByRole('spinbutton', { name: 'Image width percent' });
    await widthInput.fill('72');
    await widthInput.press('Enter');
  } else {
    const handle = imageToolbar.getByRole('button', { name: 'Resize image' });
    const box = await handle.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x - 140, box.y + box.height / 2, { steps: 5 });
      await page.mouse.up();
    }
    const widthInput = imageToolbar.getByRole('spinbutton', { name: 'Image width percent' });
    await widthInput.fill('72');
    await widthInput.press('Enter');
  }

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved').first()).toBeVisible();

  const persisted = await page.request.get(`/api/cms/pages/${encodeURIComponent(slug)}`, {
    headers: { 'x-vd-editor-smoke': SMOKE_TOKEN }
  });
  expect(persisted.ok()).toBe(true);
  const payload = await persisted.json();
  const serialized = JSON.stringify(payload);
  expect(serialized).toContain('Edited directly');
  expect(serialized).toContain('Edited body directly');
  expect(serialized).toContain('"aspectRatio":"1/1"');
  expect(serialized).toContain('"align":"right"');
  const imageProps = payload.draftData.content.find(
    (item: { props?: { id?: string } }) => item.props?.id === 'vd_smoke_direct_image'
  )?.props;
  expect(imageProps.__vdImageEdits.src.width).toBeLessThan(100);
  expect(pageErrors).toEqual([]);

  pageErrors.length = 0;
  await page.goto('/edit/pages/home', { waitUntil: 'domcontentloaded' });
  await waitForEditorReady(page);
  await expect(page.frameLocator('iframe').first().locator('[data-puck-component]').first()).toBeVisible();
  expect(pageErrors).toEqual([]);
});
