import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { OXFORDSHIRE_PAGE, WITNEY_PAGE } from './location-pages';

const ROOT = path.resolve(import.meta.dir, '..');
const PAGES = [WITNEY_PAGE, OXFORDSHIRE_PAGE];

describe('location pages', () => {
  test('each page has a route and a sitemap entry for its slug', () => {
    const sitemap = readFileSync(path.join(ROOT, 'app', 'sitemap.ts'), 'utf8');
    for (const page of PAGES) {
      expect(existsSync(path.join(ROOT, 'app', page.slug, 'page.tsx'))).toBe(true);
      expect(sitemap).toContain(`/${page.slug}\``);
    }
  });

  test('titles and descriptions fit a search result', () => {
    for (const page of PAGES) {
      expect(page.title.length).toBeLessThanOrEqual(70);
      expect(page.description.length).toBeGreaterThanOrEqual(110);
      expect(page.description.length).toBeLessThanOrEqual(165);
    }
  });

  test('the two pages are not copies of each other', () => {
    expect(WITNEY_PAGE.title).not.toBe(OXFORDSHIRE_PAGE.title);
    expect(WITNEY_PAGE.description).not.toBe(OXFORDSHIRE_PAGE.description);
    expect(WITNEY_PAGE.lead).not.toBe(OXFORDSHIRE_PAGE.lead);
    expect(WITNEY_PAGE.area.paragraphs).not.toEqual(OXFORDSHIRE_PAGE.area.paragraphs);
  });

  test('every page names its place in the title, headline and opening line', () => {
    expect(WITNEY_PAGE.title).toContain('Witney');
    expect(WITNEY_PAGE.headline.join(' ')).toContain('Witney');
    expect(WITNEY_PAGE.lead).toContain('Witney');
    expect(OXFORDSHIRE_PAGE.title).toContain('Oxfordshire');
    expect(OXFORDSHIRE_PAGE.headline.join(' ')).toContain('Oxfordshire');
    expect(OXFORDSHIRE_PAGE.lead).toContain('Oxfordshire');
  });

  test('every question has an answer', () => {
    for (const page of PAGES) {
      expect(page.faqs.length).toBeGreaterThanOrEqual(4);
      for (const faq of page.faqs) {
        expect(faq.question.trim().endsWith('?')).toBe(true);
        expect(faq.answer.trim().length).toBeGreaterThan(40);
      }
    }
  });
});
