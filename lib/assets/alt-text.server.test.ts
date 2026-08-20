import { describe, expect, it } from 'bun:test';
import { shouldGenerateAltForAsset } from './alt-text.server';

describe('shouldGenerateAltForAsset', () => {
  it('requires an image mime type', () => {
    expect(
      shouldGenerateAltForAsset({
        key: 'uploads/doc.txt',
        mime: 'text/plain'
      })
    ).toBe(false);
  });

  it('does not generate when manual alt source is set', () => {
    expect(
      shouldGenerateAltForAsset({
        key: 'uploads/manual-photo.jpg',
        alt: 'Hero image',
        altSource: 'manual',
        mime: 'image/jpeg'
      })
    ).toBe(false);
  });

  it('allows automatic generation when image alt is empty', () => {
    expect(
      shouldGenerateAltForAsset({
        key: 'uploads/empty-alt.jpg',
        mime: 'image/png',
        alt: undefined
      })
    ).toBe(true);
  });

  it('allows overwrite when user explicitly requests regenerate', () => {
    expect(
      shouldGenerateAltForAsset(
        {
          key: 'uploads/auto-photo.jpg',
          alt: 'Existing auto text',
          altSource: 'auto',
          mime: 'image/webp'
        },
        { force: true }
      )
    ).toBe(true);
  });

  it('does not allow overwrite for manually edited alt even when forced', () => {
    expect(
      shouldGenerateAltForAsset(
        {
          key: 'uploads/manual-photo.jpg',
          alt: 'Existing manual text',
          altSource: 'manual',
          mime: 'image/webp'
        },
        { force: true }
      )
    ).toBe(false);
  });

  it('does not generate when alt is manually set but empty', () => {
    expect(
      shouldGenerateAltForAsset(
        {
          key: 'uploads/manual-empty-photo.jpg',
          alt: '',
          altSource: 'manual',
          mime: 'image/jpeg'
        },
        { force: true }
      )
    ).toBe(false);
  });
});
