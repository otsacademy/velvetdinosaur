import { describe, expect, it } from 'bun:test';
import { buildThemeEditorUrl } from './theme-editor-session';

describe('buildThemeEditorUrl', () => {
  it('includes a token query param when provided', () => {
    const url = buildThemeEditorUrl({
      themeEditorOrigin: 'https://theme.example.com',
      siteOrigin: 'https://app.example.com',
      returnUrl: 'https://app.example.com/admin/store',
      role: 'customer',
      token: 'signed-token'
    });

    expect(url.searchParams.get('token')).toBe('signed-token');
  });
});
