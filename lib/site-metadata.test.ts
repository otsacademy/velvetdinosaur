import { describe, expect, test } from 'bun:test';

import { GOOGLE_SITE_VERIFICATION, siteMetadata } from './site-metadata';

describe('site metadata', () => {
  // Without this tag Search Console loses ownership of the property, and the
  // sitemap and performance figures go with it.
  test('every page carries the Google Search Console verification token', () => {
    expect(GOOGLE_SITE_VERIFICATION).toBe('alE4DoI371RjTIl3adBuhxgWdQXeXo0Q07j2bH_Zq8M');
    expect(siteMetadata.verification?.google).toBe(GOOGLE_SITE_VERIFICATION);
  });
});
