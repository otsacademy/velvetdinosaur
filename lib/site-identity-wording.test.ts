import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { ALL_ARTICLES, TAGS } from '@/lib/articles';
import { ASAP_CHAPTER_OPTIONS } from '@/lib/chapters';
import { normalizeArticleAuthorName } from '@/lib/news-presentation';
import {
  resolvePublicSiteEditorialName,
  resolvePublicSiteLogoPath,
  resolvePublicSiteName,
  resolvePublicSiteStaffName
} from '@/lib/site-config';

// This shared code came from the Academics Stand Against Poverty site. Until
// November 2026 it named ASAP as the author of unsigned news ("ASAP Staff",
// "ASAP Editorial") and the organiser of events, used ASAP's missing logo as
// every default avatar and stored it on new articles and profiles, wrote ASAP
// into calendar files, and demanded an ASAP chapter, from an empty list,
// before an invite could be sent.
const OTHER_SITE_NAMES = [/\bASAP\b/, /Academics Stand/i, /academicsstand/i, /acadsap/i, /asap-(admin-)?logo/i, /\bMichal\b|\bApollo\b/];

// Lines marked "legacy-asap-data" recognise data that the other site stored,
// so old records still show this site's defaults.
const LEGACY_MARKER = 'legacy-asap-data';

const ROOT = path.resolve(import.meta.dir, '..');
const FILES = [
  'lib/user-profile.ts',
  'lib/news-presentation.ts',
  'lib/news/scheduled-publishing.server.ts',
  'app/api/admin/approvals/news/route.ts',
  'lib/events.server.ts',
  'app/api/events/route.ts',
  'app/api/news/articles/route.ts',
  'lib/event-calendar.ts',
  'lib/articles.ts',
  'components/edit/news-editor/news-editor-plate-utils.ts',
  'components/edit/calendar/calendar-event-hovercard.tsx',
  'components/edit/event-editor/event-chapters-section.tsx',
  'components/edit/news-editor/news-editor-chapter-section.tsx',
  'components/edit/page-editor-chapter-section.tsx',
  'components/admin/users/invitations-panel.tsx',
  'components/admin/users/active-users-panel.tsx',
  'components/news/author-hover-card.client.tsx',
  // The stored default picture of new articles and profiles.
  'models/NewsArticle.ts',
  'models/NewsArticleSnapshot.ts',
  'models/UserProfile.ts',
  // Only some sites have their own account profile page.
  'components/account/account-profile-form.shared.ts',
  'components/account/account-profile-form.client.tsx',
  'components/account/account-profile-sections.client.tsx',
  'components/account/account-communications-settings.client.tsx',
  'components/account/account-google-linking.client.tsx'
];

describe('shared code names this site, not the one it came from', () => {
  test('no checked file names the other site, its logo or its people', () => {
    const present = FILES.filter((file) => existsSync(path.join(ROOT, file)));
    expect(present.length).toBeGreaterThanOrEqual(16);
    const hits: string[] = [];
    for (const file of present) {
      readFileSync(path.join(ROOT, file), 'utf8')
        .split('\n')
        .forEach((line, index) => {
          if (/^\s*(\/\/|\/\*|\*|\{\/\*)/.test(line) || line.includes(LEGACY_MARKER)) return;
          const found = OTHER_SITE_NAMES.filter((pattern) => pattern.test(line)).map(String);
          if (found.length) hits.push(`${file}:${index + 1} ${found.join(' ')} | ${line.trim()}`);
        });
    }
    expect(hits).toEqual([]);
  });

  test('the identity fallbacks are this site’s own', () => {
    const name = resolvePublicSiteName();
    for (const value of [name, resolvePublicSiteStaffName(), resolvePublicSiteEditorialName()]) {
      expect(value.trim().length).toBeGreaterThan(0);
      expect(OTHER_SITE_NAMES.filter((pattern) => pattern.test(value))).toEqual([]);
      expect(value).toContain(name);
    }
    expect(resolvePublicSiteLogoPath()).toMatch(/^(\/|https:\/\/)/);
    expect(resolvePublicSiteLogoPath()).not.toMatch(/asap/i);
  });

  test('unsigned and legacy news authors show this site’s default name', () => {
    const fallback = normalizeArticleAuthorName('');
    expect(fallback).toBe(resolvePublicSiteStaffName());
    expect(normalizeArticleAuthorName('ASAP Editorial')).toBe(fallback);
    expect(normalizeArticleAuthorName('ASAP Staff')).toBe(fallback);
    expect(normalizeArticleAuthorName(resolvePublicSiteEditorialName())).toBe(fallback);
    expect(normalizeArticleAuthorName('Sam Taylor')).toBe('Sam Taylor');
  });

  test('the sample articles and suggested tags are not the other site’s', () => {
    expect(ALL_ARTICLES).toEqual([]);
    expect(TAGS.join(' ')).not.toMatch(/Essay Prize|Book Awards|Journal|Research|Global Policy/);
    const plateUtils = readFileSync(path.join(ROOT, 'components/edit/news-editor/news-editor-plate-utils.ts'), 'utf8');
    const tagsLine = plateUtils.split('\n').find((line) => line.startsWith('export const DEFAULT_TAGS')) || '';
    expect(tagsLine).not.toBe('');
    expect(tagsLine).not.toMatch(/Research|Chapters|Awards/);
  });

  test('without chapters, nobody is asked to choose one', () => {
    if (ASAP_CHAPTER_OPTIONS.length > 0) return;
    const invitations = readFileSync(path.join(ROOT, 'components/admin/users/invitations-panel.tsx'), 'utf8');
    expect(invitations).toContain('if (ASAP_CHAPTER_OPTIONS.length > 0 && !primaryChapterSlug) {');
    for (const file of [
      'components/edit/event-editor/event-chapters-section.tsx',
      'components/edit/news-editor/news-editor-chapter-section.tsx',
      'components/edit/page-editor-chapter-section.tsx'
    ]) {
      expect(readFileSync(path.join(ROOT, file), 'utf8')).toMatch(/if \(ASAP_CHAPTER_OPTIONS\.length === 0\) return null/);
    }
  });
});
