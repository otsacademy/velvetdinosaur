import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { GOOGLE_REVIEWS } from '../components/home/site-data';
import { LOCATION_PAGES, placeHref, type LocationPageContent } from './location-pages';

const ROOT = path.resolve(import.meta.dir, '..');

function read(...segments: string[]) {
  return readFileSync(path.join(ROOT, ...segments), 'utf8');
}

/** The wording each page has to own: pages that only swap the place name are doorway pages. */
function ownWording(page: LocationPageContent) {
  return [
    page.title,
    page.description,
    page.lead,
    page.photoCaption,
    page.reasons.title,
    ...page.reasons.cards.map((card) => card.body),
    page.area.title,
    ...page.area.paragraphs
  ];
}

describe('location pages', () => {
  test('each page has a route, a sitemap entry and a visual baseline route', () => {
    const sitemap = read('app', 'sitemap.ts');
    const visual = read('tests', 'visual', 'visual.spec.ts');
    for (const page of LOCATION_PAGES) {
      expect(existsSync(path.join(ROOT, 'app', page.slug, 'page.tsx'))).toBe(true);
      expect(sitemap).toContain(`/${page.slug}\``);
      expect(visual).toContain(`path: '/${page.slug}'`);
    }
  });

  test('slugs and focus words are unique', () => {
    const slugs = LOCATION_PAGES.map((page) => page.slug);
    const focuses = LOCATION_PAGES.map((page) => page.focus);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(focuses).size).toBe(focuses.length);
  });

  test('titles and descriptions fit a search result', () => {
    for (const page of LOCATION_PAGES) {
      expect(page.title.length).toBeLessThanOrEqual(70);
      expect(page.description.length).toBeGreaterThanOrEqual(110);
      expect(page.description.length).toBeLessThanOrEqual(165);
    }
  });

  test('no two pages share their wording', () => {
    const owners = new Map<string, string>();
    const repeats: string[] = [];
    for (const page of LOCATION_PAGES) {
      for (const text of ownWording(page)) {
        const owner = owners.get(text);
        if (owner && owner !== page.slug) repeats.push(`${page.slug} repeats ${owner}: ${text}`);
        owners.set(text, page.slug);
      }
    }
    expect(repeats).toEqual([]);
  });

  test('every page names its focus in the title, headline and opening line', () => {
    for (const page of LOCATION_PAGES) {
      const focus = page.focus.toLowerCase();
      expect(page.title.toLowerCase()).toContain(focus);
      expect(page.headline.join(' ').toLowerCase()).toContain(focus);
      expect(page.lead.toLowerCase()).toContain(focus);
    }
  });

  test('every page shows three real Google reviews', () => {
    const names = new Set(GOOGLE_REVIEWS.map((review) => review.name));
    for (const page of LOCATION_PAGES) {
      expect(page.reviewNames.length).toBe(3);
      for (const name of page.reviewNames) expect(names.has(name)).toBe(true);
    }
  });

  test('place names link to their own page, never to the page they are on', () => {
    expect(placeHref('Carterton', 'web-design-witney')).toBe('/web-design-carterton');
    expect(placeHref('Chipping Norton', 'web-design-oxfordshire')).toBe('/web-design-chipping-norton');
    expect(placeHref('Witney', 'web-design-witney')).toBeUndefined();
    expect(placeHref('Bampton', 'web-design-witney')).toBeUndefined();
  });

  test('every page is linked from the footer or from another local page', () => {
    const chrome = read('components', 'home', 'home-chrome.tsx');
    for (const page of LOCATION_PAGES) {
      const inFooter = chrome.includes(`href: "/${page.slug}"`);
      const fromAnotherPage = LOCATION_PAGES.some(
        (other) => other.slug !== page.slug && other.area.places.includes(page.focus)
      );
      expect(inFooter || fromAnotherPage).toBe(true);
    }
  });

  test('every question has an answer', () => {
    for (const page of LOCATION_PAGES) {
      expect(page.faqs.length).toBeGreaterThanOrEqual(4);
      for (const faq of page.faqs) {
        expect(faq.question.trim().endsWith('?')).toBe(true);
        expect(faq.answer.trim().length).toBeGreaterThan(40);
      }
    }
  });

  test('copy uses curly apostrophes and no dashes', () => {
    const copy = JSON.stringify(LOCATION_PAGES);
    expect(copy).not.toMatch(/[–—]/);
    expect(copy).not.toContain("'");
  });
});
