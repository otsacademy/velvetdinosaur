import { test, expect, type Locator, type Page } from '@playwright/test';

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
        src: '/assets/hero-panel.svg',
        alt: 'Direct edit test image',
        caption: 'Direct edit test caption',
        __vdImageEdits: {
          src: {
            width: 100,
            align: 'center',
            aspectRatio: 'original',
            focalX: 0,
            focalY: 100
          }
        }
      }
    }
  ]
};

const CANVAS_INTERACTION_DATA = {
  root: { props: { title: 'Canvas interaction guard' } },
  content: [
    {
      type: 'CTA',
      props: {
        id: 'vd_smoke_canvas_interaction',
        title: 'Safe editor canvas',
        layout: { marginTop: 180 },
        subtitle: 'Selecting this call to action must not navigate the preview frame.',
        buttonLabel: 'Open another editor',
        buttonLink: {
          href: '/edit/pages/home',
          target: '_self',
          rel: ''
        }
      }
    }
  ]
};

const TEST_URL = 'https://example.com/smoke.pdf';
const SMOKE_TOKEN = process.env.VD_EDITOR_SMOKE_TOKEN || 'playwright';
const AUTOFRAME_STYLESHEET_WARNING = /AutoFrame couldn't load a stylesheet/i;
const TEST_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64'
);

const FELLOWSHIP_ASSET_DATA = {
  root: { props: { title: 'Fellowship asset smoke' } },
  content: [
    {
      type: 'FellowshipHero',
      props: {
        id: 'smoke_fellowship_hero',
        badge: 'ASAP Fellowship Program',
        title: 'Be An ASAP Fellow',
        description: 'Smoke-test fellowship hero.',
        primaryCtaLabel: '',
        primaryCtaHref: '',
        secondaryCtaLabel: '',
        secondaryCtaHref: '',
        logoSrc: '/images/asap-logo.png',
        logoAlt: 'ASAP logo',
        programMark: 'Fellowship Program',
        backgroundImageSrc: '',
        backgroundImageAlt: '',
        panelImageSrc: '',
        panelImageAlt: '',
        highlights: []
      }
    }
  ]
};

test.use({
  extraHTTPHeaders: {
    'x-vd-editor-smoke': SMOKE_TOKEN
  }
});

test.beforeEach(async ({ page }) => {
  // Review overlays can appear for authenticated/admin sessions and block editor interactions.
  // Disable review context for smoke tests so interactions target editor UI only.
  await page.route('**/api/review/session-token**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'Review mode disabled in smoke tests.' })
    });
  });
  await page.route('**/api/review/context**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'Review mode disabled in smoke tests.' })
    });
  });
});

async function seedAttachment(page: Page, slug: string) {
  await page.request.put(`/api/cms/pages/${encodeURIComponent(slug)}`, {
    data: JSON.stringify({ data: ATTACHMENT_DATA }),
    headers: {
      'Content-Type': 'application/json',
      'x-vd-editor-smoke': SMOKE_TOKEN
    }
  });
}

async function seedDirectEdit(page: Page, slug: string) {
  await page.request.put(`/api/cms/pages/${encodeURIComponent(slug)}`, {
    data: JSON.stringify({ data: DIRECT_EDIT_DATA }),
    headers: {
      'Content-Type': 'application/json',
      'x-vd-editor-smoke': SMOKE_TOKEN
    }
  });
}

async function seedCanvasInteraction(page: Page, slug: string) {
  await page.request.put(`/api/cms/pages/${encodeURIComponent(slug)}`, {
    data: JSON.stringify({ data: CANVAS_INTERACTION_DATA }),
    headers: {
      'Content-Type': 'application/json',
      'x-vd-editor-smoke': SMOKE_TOKEN
    }
  });
}


async function makeImageDataTransfer(page: Page, fileName: string) {
  return page.evaluateHandle(
    ({ bytes, name }) => {
      const dataTransfer = new DataTransfer();
      const file = new File([new Uint8Array(bytes)], name, { type: 'image/png' });
      dataTransfer.items.add(file);
      return dataTransfer;
    },
    { bytes: Array.from(TEST_PNG), name: fileName }
  );
}



async function installMockAssetRoutes(page: Page) {
  const uploads: Array<{
    key: string;
    name: string;
    mime: string;
    size: number;
    createdAt: string;
    alt: string;
  }> = [];

  await page.route('**/api/assets/upload', async (route) => {
    const index = uploads.length + 1;
    const name = index === 1 ? 'logo-drop' : index === 2 ? 'canvas-drop' : `asset-${index}`;
    const key = `smoke/${name}.png`;
    uploads.unshift({
      key,
      name,
      mime: 'image/png',
      size: TEST_PNG.length,
      createdAt: new Date().toISOString(),
      alt: name
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        key,
        url: `/api/assets/file?key=${encodeURIComponent(key)}`,
        name,
        size: TEST_PNG.length,
        type: 'image/png',
        alt: name,
        width: 1,
        height: 1
      })
    });
  });

  await page.route('**/api/assets/list**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: uploads, nextCursor: null })
    });
  });

  await page.route('**/api/assets/folders**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [] })
    });
  });

  await page.route(/\/api\/assets\/file\?/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: TEST_PNG
    });
  });
}

async function openAssetLibraryFromProperties(page: Page, urlInput: Locator) {
  const browseButton = () => page.getByRole('button', { name: 'Browse' }).first();
  const libraryDialog = page.getByRole('dialog', { name: 'Asset library' });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await expect(browseButton()).toBeVisible({ timeout: 10_000 });
      await browseButton().click({ timeout: 10_000 });
      await expect(libraryDialog).toBeVisible({ timeout: 10_000 });
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.getByRole('button', { name: 'Properties' }).first().click({ force: true });
      await expect(urlInput).toBeVisible({ timeout: 10_000 });
    }
  }
}

async function dismissGettingStartedIfPresent(page: Page, timeout = 3_000) {
  const dialog = page.getByRole('dialog', { name: 'Getting Started' });
  const visible = await dialog
    .waitFor({ state: 'visible', timeout })
    .then(() => true)
    .catch(() => false);
  if (!visible) return;
  await dialog.getByRole('button', { name: 'Done' }).click({ timeout: 10_000 });
  await expect(dialog).toBeHidden({ timeout: 10_000 });
}

async function waitForEditorReady(page: Page) {
  await expect(page.locator('[data-puck-preview]')).toBeVisible({ timeout: 30_000 });
  await expect(page.frameLocator('iframe').first().locator('[data-site-design-frame]')).toBeVisible({ timeout: 30_000 });
  await dismissGettingStartedIfPresent(page, 10_000);
  await expect(page.getByRole('button', { name: /^Save$/ })).toBeVisible({ timeout: 10_000 });
}

async function clickWithPointer(locator: Locator, touch: boolean) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  if (touch) {
    await locator.tap({ position: { x: box.width / 2, y: box.height / 2 } });
  } else {
    await locator.click({ position: { x: box.width / 2, y: box.height / 2 } });
  }
}

async function clickRangeEnd(locator: Locator, end: 'minimum' | 'maximum', touch: boolean) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const position = {
    x: end === 'minimum' ? 1 : Math.max(1, box.width - 1),
    y: box.height / 2
  };
  if (touch) {
    await locator.tap({ position });
  } else {
    await locator.click({ position });
  }
}

async function closeActiveEditorPanels(page: Page) {
  const activePanel = page.locator('[data-slot="menu-dock-item"][data-active="true"]');
  for (let attempt = 0; attempt < 3 && (await activePanel.count()) > 0; attempt += 1) {
    await activePanel.first().click({ force: true });
  }
  await page.keyboard.press('Escape');
}

function collectEditorWarnings(page: Page) {
  const warnings: string[] = [];
  page.on('console', (message) => {
    const text = message.text();
    if (AUTOFRAME_STYLESHEET_WARNING.test(text)) {
      warnings.push(text);
    }
  });
  return warnings;
}

test('editor loads, asset picker opens, and draft persists', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  const editorWarnings = collectEditorWarnings(page);
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const slug = `smoke-${testInfo.project.name}`;

  await seedAttachment(page, slug);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        response.url().includes(`/api/cms/pages/${encodeURIComponent(slug)}`)
    ),
    page.goto(`/edit/${encodeURIComponent(slug)}`, { waitUntil: 'domcontentloaded' })
  ]);

  await waitForEditorReady(page);

  await page.getByRole('button', { name: 'Outline' }).click();
  await page.getByText('Attachment').first().click();
  // Outline uses a modal sheet; close it so the bottom dock is clickable.
  await page.keyboard.press('Escape');
  // Closing the mobile outline can also clear Puck's selection; reselect the
  // canvas block before opening its properties.
  const attachmentBlock = page
    .frameLocator('iframe')
    .first()
    .locator('[data-puck-component="vd_smoke_attachment"]');
  const propertiesButton = page.getByRole('button', { name: 'Properties' }).first();
  const urlInput = page.getByPlaceholder('Paste a URL, upload, or pick from library').first();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (testInfo.project.name === 'mobile') {
      await attachmentBlock.tap({ position: { x: 8, y: 8 }, force: true });
      await propertiesButton.tap({ force: true });
    } else {
      await attachmentBlock.click({ position: { x: 8, y: 8 }, force: true });
      await propertiesButton.click({ force: true });
    }
    const opened = await urlInput.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
    if (opened) break;
    await page.keyboard.press('Escape');
  }
  await expect(urlInput).toBeVisible({ timeout: 10_000 });

  await openAssetLibraryFromProperties(page, urlInput);

  const libraryDialog = page.getByRole('dialog', { name: 'Asset library' });
  const gridViewTab = libraryDialog.getByRole('tab', { name: 'Grid view' });
  const listViewTab = libraryDialog.getByRole('tab', { name: 'List view' });

  await expect(gridViewTab).toHaveAttribute('data-state', 'active');
  await expect(listViewTab).toBeVisible();
  await expect(libraryDialog.getByPlaceholder('Search uploads by name or description')).toBeVisible();
  await expect(libraryDialog.getByText('Upload assets')).toBeVisible();
  await expect(libraryDialog.getByText('Upload files').first()).toBeVisible();
  await expect(libraryDialog.getByRole('button', { name: /^Upload$/ })).toBeDisabled();
  await expect(libraryDialog.getByRole('button', { name: 'New folder' })).toBeVisible();

  await listViewTab.click();
  await expect(listViewTab).toHaveAttribute('data-state', 'active');
  await gridViewTab.click();
  await expect(gridViewTab).toHaveAttribute('data-state', 'active');

  await page.keyboard.press('Escape');
  await expect(libraryDialog).toBeHidden();
  await expect(urlInput).toBeVisible();

  await urlInput.fill(TEST_URL);
  await expect(urlInput).toHaveValue(TEST_URL);
  const preview = page.frameLocator('iframe').first();
  const attachment = preview.locator('a', { hasText: /Download file/i });
  await expect(attachment).toBeVisible();
  await expect(attachment).not.toHaveAttribute('href');
  await expect(attachment).toHaveAttribute('data-vd-editor-canvas-href', TEST_URL);

  // Properties panel may be pinned open; closing is not required for correctness.
  // Ensure it doesn't block draft persistence.
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved')).toBeVisible();

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
  expect(editorWarnings).toEqual([]);
});

test('text and images edit directly on the canvas and persist', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const slug = `smoke-direct-${testInfo.project.name}`;
  const touch = testInfo.project.name.toLowerCase().includes('mobile');
  await page.addInitScript(() => {
    window.localStorage.setItem('vd:asap-editor:getting-started:dismissed:v1', '1');
  });
  await seedDirectEdit(page, slug);
  await page.goto(`/edit/pages/${encodeURIComponent(slug)}`, { waitUntil: 'domcontentloaded' });
  await waitForEditorReady(page);

  const preview = page.frameLocator('iframe').first();
  const textBlock = preview.locator('[data-puck-component="vd_smoke_direct_text"]');
  const editableText = textBlock.locator('[contenteditable]');
  let heading = editableText.nth(0);
  let body = editableText.nth(1);

  await heading.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  await clickWithPointer(heading, touch);
  heading = editableText.nth(0);
  await clickWithPointer(heading, touch);
  heading = editableText.nth(0);
  await expect(heading).toHaveAttribute('contenteditable', 'plaintext-only');
  await heading.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await heading.pressSequentially('Edited directly');
  await clickWithPointer(body, touch);
  body = editableText.nth(1);
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
  const focalXInput = imageToolbar.getByRole('slider', { name: 'Focal point X' });
  const focalYInput = imageToolbar.getByRole('slider', { name: 'Focal point Y' });
  await expect(focalXInput).toHaveValue('0');
  await expect(focalYInput).toHaveValue('100');
  await clickRangeEnd(focalXInput, 'maximum', touch);
  await clickRangeEnd(focalYInput, 'minimum', touch);
  if (touch) {
    const widthInput = imageToolbar.getByRole('spinbutton', { name: 'Image width percent' });
    await widthInput.fill('72');
    await widthInput.blur();
    await expect(widthInput).toHaveValue('72');
  } else {
    const resizeHandle = imageToolbar.getByRole('button', { name: 'Resize image' });
    const resizeBox = await resizeHandle.boundingBox();
    expect(resizeBox).not.toBeNull();
    if (resizeBox) {
      await page.mouse.move(resizeBox.x + resizeBox.width / 2, resizeBox.y + resizeBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(resizeBox.x - 140, resizeBox.y + resizeBox.height / 2, { steps: 5 });
      await page.mouse.up();
    }
    const widthInput = imageToolbar.getByRole('spinbutton', { name: 'Image width percent' });
    await widthInput.fill('72');
    await widthInput.blur();
    await expect(widthInput).toHaveValue('72');
  }

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved').first()).toBeVisible();

  const persisted = await page.request.get(`/api/cms/pages/${encodeURIComponent(slug)}`, {
    headers: { 'x-vd-editor-smoke': SMOKE_TOKEN }
  });
  expect(persisted.ok()).toBe(true);
  const persistedJson = await persisted.json();
  const persistedText = JSON.stringify(persistedJson);
  expect(persistedText).toContain('Edited directly');
  expect(persistedText).toContain('Edited body directly');
  expect(persistedText).toContain('"aspectRatio":"1/1"');
  expect(persistedText).toContain('"align":"right"');
  const imageProps = persistedJson.draftData.content.find(
    (item: { props?: { id?: string } }) => item.props?.id === 'vd_smoke_direct_image'
  )?.props;
  expect(imageProps.__vdImageEdits.src.width).toBeLessThan(100);
  expect(imageProps.__vdImageEdits.src.focalX).toBe(100);
  expect(imageProps.__vdImageEdits.src.focalY).toBe(0);
  expect(pageErrors).toEqual([]);

  await imageToolbar.getByRole('button', { name: 'Reset image layout' }).click();
  await expect(imageToolbar.getByRole('spinbutton', { name: 'Image width percent' })).toHaveValue('100');
  await expect(focalXInput).toHaveValue('50');
  await expect(focalYInput).toHaveValue('50');
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response.url().includes(`/api/cms/pages/${encodeURIComponent(slug)}`)
    ),
    page.getByRole('button', { name: 'Save' }).click()
  ]);
  const resetResponse = await page.request.get(`/api/cms/pages/${encodeURIComponent(slug)}`, {
    headers: { 'x-vd-editor-smoke': SMOKE_TOKEN }
  });
  expect(resetResponse.ok()).toBe(true);
  const resetJson = await resetResponse.json();
  const resetImageProps = resetJson.draftData.content.find(
    (item: { props?: { id?: string } }) => item.props?.id === 'vd_smoke_direct_image'
  )?.props;
  expect(resetImageProps.__vdImageEdits.src).toMatchObject({
    width: 100,
    align: 'center',
    aspectRatio: 'original',
    focalX: 50,
    focalY: 50
  });

  await imageToolbar.getByRole('button', { name: 'Replace', exact: true }).click();
  await imageToolbar.getByRole('button', { name: 'Browse', exact: true }).click();
  const directAssetLibrary = page.getByRole('dialog', { name: 'Asset library' });
  await expect(directAssetLibrary).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(directAssetLibrary).toBeHidden();

  pageErrors.length = 0;
  await page.goto('/edit/pages/home', { waitUntil: 'domcontentloaded' });
  await waitForEditorReady(page);
  await expect(page.frameLocator('iframe').first().locator('[data-puck-component]').first()).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('canvas links stay inert while their blocks remain selectable', async ({ page }, testInfo) => {
  const slug = `smoke-canvas-actions-${testInfo.project.name}`;
  await page.addInitScript(() => {
    window.localStorage.setItem('vd:asap-editor:getting-started:dismissed:v1', '1');
  });
  await seedCanvasInteraction(page, slug);
  await page.goto(`/edit/pages/${encodeURIComponent(slug)}`, { waitUntil: 'domcontentloaded' });
  await waitForEditorReady(page);

  const previewFrame = page.frames().find((frame) => frame.name() === 'preview-frame');
  expect(previewFrame).toBeDefined();
  const preview = page.frameLocator('iframe').first();
  const link = preview.locator('a', { hasText: 'Open another editor' });
  await expect(link).toBeVisible();
  await expect(link).not.toHaveAttribute('href');
  await expect(link).toHaveAttribute('data-vd-editor-canvas-href', '/edit/pages/home');
  const interactionGuard = preview.locator('[data-vd-canvas-interaction-guard]');
  await expect(interactionGuard).toHaveCount(1);
  await expect(interactionGuard).toHaveAttribute('data-vd-canvas-interaction-guard-active', 'true');
  expect(
    await link.evaluate((element) => Boolean(element.closest('[data-vd-canvas-interaction-guard]')))
  ).toBe(true);

  const block = preview.locator('[data-puck-component="vd_smoke_canvas_interaction"]');
  await block.click({ position: { x: 8, y: 8 } });
  await expect(preview.getByRole('button', { name: 'Duplicate' })).toBeVisible();
  await expect(preview.getByRole('button', { name: 'Delete' })).toBeVisible();

  const frameUrlBefore = previewFrame?.url();
  // The selected block's Puck properties panel can overlap a right-aligned
  // canvas link. Force the event onto the marked link so this assertion tests
  // the editor navigation guard rather than viewport hit-testing.
  await link.click({ force: true });
  await page.waitForTimeout(250);

  expect(previewFrame?.url()).toBe(frameUrlBefore);
  await expect(block).toBeVisible();
  await expect(preview.getByRole('button', { name: 'Duplicate' })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/edit/pages/${slug}$`));
});

test('media library loads', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/edit/media', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Media Library' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Upload' })).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test('secondary editor pages render without inline field type errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/edit/about', { waitUntil: 'domcontentloaded' });
  await waitForEditorReady(page);

  await expect(page.getByText('This page couldn’t load')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
