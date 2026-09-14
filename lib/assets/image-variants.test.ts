import { describe, expect, test } from 'bun:test';
import { buildVariantKey, collectAssetStorageKeys } from './image-variants';

describe('collectAssetStorageKeys', () => {
  test('lists the public key, the original and every rendered variant once', () => {
    const publicKey = 'uploads/team/portrait-1234.webp';
    const record = {
      key: publicKey,
      fallbackKey: publicKey,
      originalKey: 'asset-originals/team/portrait-1234.jpg',
      variants: {
        thumbnail: { key: buildVariantKey(publicKey, 'thumbnail') },
        card: { key: buildVariantKey(publicKey, 'card') },
        inline: { key: buildVariantKey(publicKey, 'inline') },
        hero: { key: buildVariantKey(publicKey, 'hero') },
        avatar: { key: buildVariantKey(publicKey, 'avatar') },
        social: { key: buildVariantKey(publicKey, 'social') }
      }
    };
    expect(collectAssetStorageKeys(record)).toEqual([
      publicKey,
      'asset-originals/team/portrait-1234.jpg',
      'uploads/team/portrait-1234--thumbnail.webp',
      'uploads/team/portrait-1234--card.webp',
      'uploads/team/portrait-1234--hero.webp',
      'uploads/team/portrait-1234--avatar.webp',
      'uploads/team/portrait-1234--social.jpg'
    ]);
  });

  test('passthrough files list the public key and the original only', () => {
    expect(
      collectAssetStorageKeys({
        key: 'uploads/docs/menu.pdf',
        fallbackKey: 'uploads/docs/menu.pdf',
        originalKey: 'asset-originals/docs/menu.pdf'
      })
    ).toEqual(['uploads/docs/menu.pdf', 'asset-originals/docs/menu.pdf']);
  });

  test('legacy records without originals or variants still purge the public key', () => {
    expect(collectAssetStorageKeys({ key: 'uploads/legacy.png' })).toEqual(['uploads/legacy.png']);
    expect(collectAssetStorageKeys(null)).toEqual([]);
    expect(collectAssetStorageKeys(undefined)).toEqual([]);
  });

  test('ignores keys outside the upload prefixes and malformed values', () => {
    expect(
      collectAssetStorageKeys({
        key: 'uploads/a.webp',
        originalKey: 'private/secret.jpg',
        fallbackKey: 'uploads/../etc/passwd',
        variants: { thumbnail: { key: 42 }, card: null, hero: { key: 'uploads/' } }
      })
    ).toEqual(['uploads/a.webp']);
  });
});
