import { expect, test, type Page } from '@playwright/test';
import { Document, ExternalHyperlink, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

// ASAP's September 2026 repair 10, "Editor HTML parsing", checked in real browsers. Importing an HTML or Word file into
// the news editor, or pasting HTML into it, must run none of the code hidden in the markup: the markup is cleaned
// before Plate deserializes it, and nothing parses it into the editor's own page. The typing shortcuts must still
// format text after the move from Plate 52's autoformat plugin to Plate 53's input rules.
test.use({ extraHTTPHeaders: { 'x-vd-editor-smoke': process.env.VD_EDITOR_SMOKE_TOKEN || 'playwright' } });

// Every hidden script below adds one to this counter. It must stay at zero.
const COUNTER = '__unsafeEditorHtml';
const HOSTILE_PARTS =
  `<p>Picture <img src="/missing-editor-fixture.png" onerror="window.${COUNTER}++"></p>` +
  `<script>window.${COUNTER}++</script>` +
  `<iframe srcdoc="<script>parent.${COUNTER}++</script>"></iframe>` +
  `<p><a href="javascript:window.${COUNTER}++">Unsafe link</a></p>` +
  `<p onmouseover="window.${COUNTER}++">Hover paragraph</p>`;
const UNSAFE_MARKUP = /<script|<style|<iframe|<object|<embed|\son[a-z]+\s*=|javascript:/gi;

type Parse = { live: boolean; html: string };
type Watch = { [COUNTER]: number; __editorHtmlParses: Parse[] };

test.beforeEach(async ({ page }) => {
  await page.addInitScript((counter) => {
    localStorage.setItem('vd:asap-news-editor:getting-started:dismissed:v1', '1');
    const watch = window as unknown as Record<string, unknown>;
    watch[counter] = 0;
    // Note every piece of HTML the page parses: into a detached copy (DOMParser) or into the page's own document
    // (innerHTML on one of its elements, where an image's error handler runs).
    const parses: Parse[] = [];
    watch.__editorHtmlParses = parses;
    const parseFromString = DOMParser.prototype.parseFromString;
    DOMParser.prototype.parseFromString = function (this: DOMParser, html: string, type: DOMParserSupportedType) {
      if (type === 'text/html' && typeof html === 'string') parses.push({ live: false, html });
      return parseFromString.call(this, html, type);
    } as typeof parseFromString;
    const innerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (innerHTML?.set) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        ...innerHTML,
        set(this: Element, value: string) {
          if (typeof value === 'string' && this.ownerDocument === document) parses.push({ live: true, html: value });
          innerHTML.set?.call(this, value);
        },
      });
    }
  }, COUNTER);
  // Exercise the real editor, but never write articles or upload files to storage.
  await page.route('**/api/review/**', (route) => route.fulfill({ json: { ok: false } }));
  await page.route('**/api/news/articles/rewrite', (route) => route.fulfill({ json: { configured: false } }));
  await page.route('**/api/news/articles/*/generate-seo', (route) => route.fulfill({ json: { configured: false } }));
  await page.route('**/api/assets/**', (route) => route.fulfill({ json: { items: [], nextCursor: null } }));
  await page.route('**/api/news/articles', (route) => route.fulfill({ json: { ok: true, slug: 'untitled-article', status: 'draft' } }));
  await page.goto('/edit/news/new');
  const editor = page.locator('[data-slate-editor="true"]');
  await expect(editor).toBeVisible();
  // fill() focuses and types within milliseconds. A re-render of the just-mounted editor in that gap makes Slate clear
  // a selection it has not synced yet, and touch devices remount the editor once, so the text can be lost. The word
  // count comes from the editor's state, so retry until the text landed.
  await expect(async () => {
    await editor.fill('Article text before the import.');
    await expect(page.getByText('5 words', { exact: true })).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
});

// Everything is checked softly, so a failing run lists each reason.
async function expectNothingUnsafe(page: Page, marker: string) {
  // An image's error handler fires shortly after parsing, when the browser gives up on the image: give it time.
  await page.waitForTimeout(1_000);
  const { counter, parses } = await page.evaluate((key) => {
    const watch = window as unknown as Watch;
    return { counter: watch[key as typeof COUNTER], parses: watch.__editorHtmlParses };
  }, COUNTER);
  const unsafe = (html: string) => [...new Set(html.match(UNSAFE_MARKUP) || [])].map((part) => part.trim().toLowerCase());
  const mine = parses.filter((parse) => parse.html.includes(marker));
  expect.soft(mine.length, 'the markup was parsed at least once').toBeGreaterThan(0);
  expect.soft(mine.filter((parse) => parse.live).flatMap((parse) => unsafe(parse.html)),
    'unsafe markup parsed into the editor page itself').toEqual([]);
  // The last parse of the markup is the one Plate deserializes. Only the cleaning step may see the original.
  expect.soft(unsafe(mine.at(-1)?.html || ''), 'unsafe markup in what Plate deserialized').toEqual([]);
  expect.soft(counter, 'hidden code that ran').toBe(0);
  const editor = page.locator('[data-slate-editor="true"]');
  // The news editor shows a link as an inline element with an href, not always as <a>.
  await expect.soft(editor.locator('script, iframe, [onerror], [onmouseover], [href^="javascript:" i], [src^="javascript:" i]')).toHaveCount(0);
  // The hidden code is not kept as text in the article either.
  await expect.soft(editor).not.toContainText(COUNTER);
}

test('HTML import keeps the formatting and runs none of the code hidden in it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const html = '<h2>Imported heading</h2><p><strong>Bold text</strong> and <em>italic text</em></p>' +
    '<table><tbody><tr><td>Table cell</td></tr></tbody></table>' + HOSTILE_PARTS;
  await page.locator('input[type="file"][accept*=".html"]').setInputFiles({ name: 'import.html', mimeType: 'text/html', buffer: Buffer.from(html) });
  const editor = page.locator('[data-slate-editor="true"]');
  await expect(editor.locator('h2')).toContainText('Imported heading');
  await expect(editor.locator('strong')).toContainText('Bold text');
  await expect(editor.locator('em')).toContainText('italic text');
  await expect(editor).toContainText('Table cell');
  await expect(editor).toContainText('Unsafe link');
  await expect(editor).toContainText('Hover paragraph');
  await expectNothingUnsafe(page, 'Imported heading');
  expect(errors).toEqual([]);
});

test('HTML paste keeps the formatting and runs none of the code hidden in it', async ({ page, browserName }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const editor = page.locator('[data-slate-editor="true"]');
  await editor.getByText('Article text before the import.').click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  // A page can put any HTML on the clipboard from its own copy handler, and other programs do too, so the paste is
  // built here instead of going through the browser's clipboard, which would clean it first. Slate reads a paste from
  // `beforeinput` in Chromium and from the `paste` event in WebKit.
  const html = '<h2>Pasted heading</h2><p><strong>Pasted bold</strong> text</p>' + HOSTILE_PARTS;
  await editor.evaluate((element, { html: pasted, webkit }) => {
    const data = new DataTransfer();
    data.setData('text/html', pasted);
    data.setData('text/plain', 'Pasted heading');
    element.dispatchEvent(webkit
      ? new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })
      : new InputEvent('beforeinput', { inputType: 'insertFromPaste', dataTransfer: data, bubbles: true, cancelable: true }));
  }, { html, webkit: browserName === 'webkit' });
  await expect(editor.locator('h2')).toContainText('Pasted heading');
  await expect(editor.locator('strong')).toContainText('Pasted bold');
  await expect(editor).toContainText('Unsafe link');
  await expectNothingUnsafe(page, 'Pasted heading');
  expect(errors).toEqual([]);
});

test('DOCX import keeps the formatting and runs none of the code hidden in it', async ({ page }) => {
  const wordFile = new Document({ sections: [{ children: [
    new Paragraph({ heading: HeadingLevel.HEADING_2, text: 'Word heading' }),
    new Paragraph({ children: [
      new TextRun({ text: 'Word bold', bold: true }),
      new TextRun(' and '),
      new ExternalHyperlink({ link: `javascript:window.${COUNTER}++`, children: [new TextRun('Unsafe Word link')] }),
      new TextRun(' and '),
      new ExternalHyperlink({ link: 'https://example.com/word', children: [new TextRun('Safe Word link')] }),
    ] }),
  ] }] });
  await page.locator('input[type="file"][accept*=".docx"]').setInputFiles({
    name: 'import.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: await Packer.toBuffer(wordFile),
  });
  const editor = page.locator('[data-slate-editor="true"]');
  await expect(editor.locator('h2')).toContainText('Word heading');
  await expect(editor.locator('strong')).toContainText('Word bold');
  await expect(editor).toContainText('Unsafe Word link');
  await expect(editor.locator('[href="https://example.com/word"]')).toContainText('Safe Word link');
  await expectNothingUnsafe(page, 'Word heading');
});

test('typing shortcuts still make headings, bold and italic text, quotations and lists', async ({ page }) => {
  const editor = page.locator('[data-slate-editor="true"]');
  await editor.getByText('Article text before the import.').click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await editor.pressSequentially('## A heading');
  await expect(editor.locator('h2')).toHaveText('A heading');
  await page.keyboard.press('Enter');
  await editor.pressSequentially('Some **bold words** and *slanted words* -> done');
  await expect(editor.locator('strong')).toHaveText('bold words');
  await expect(editor.locator('em')).toHaveText('slanted words');
  await expect(editor).toContainText('and slanted words → done');
  await page.keyboard.press('Enter');
  await editor.pressSequentially('- First point');
  await expect(editor.locator('ul > li')).toContainText('First point');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await editor.pressSequentially('1. Numbered point');
  await expect(editor.locator('ol > li')).toContainText('Numbered point');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await editor.pressSequentially('> A quotation');
  await expect(editor.locator('blockquote')).toContainText('A quotation');
  await expect(editor).not.toContainText('**');
  await expect(editor).not.toContainText('## ');
});
