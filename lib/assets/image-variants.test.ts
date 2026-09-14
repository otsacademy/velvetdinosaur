import { describe, expect, test } from 'bun:test';
import { buildVariantKey, collectAssetStorageKeys, isOriginalKeyOf, originalKeyStem } from './image-variants';

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

describe('originalKeyStem / isOriginalKeyOf', () => {
  const publicKey = 'uploads/site-media/popty-cara/award-rich-fruit-4243656432c96fd45991.jpg';

  test('maps a public key to its private original stem', () => {
    expect(originalKeyStem(publicKey)).toBe('asset-originals/site-media/popty-cara/award-rich-fruit-4243656432c96fd45991');
    expect(originalKeyStem('asset-originals/x.png')).toBeNull();
    expect(originalKeyStem('uploads/')).toBeNull();
    expect(originalKeyStem('uploads/../etc.png')).toBeNull();
    expect(originalKeyStem(42)).toBeNull();
  });

  test('accepts the pipeline and replace shapes only', () => {
    const stem = 'asset-originals/site-media/popty-cara/award-rich-fruit-4243656432c96fd45991';
    expect(isOriginalKeyOf(publicKey, `${stem}.jpg`)).toBe(true);
    expect(isOriginalKeyOf(publicKey, `${stem}.PNG`)).toBe(true);
    expect(isOriginalKeyOf(publicKey, `${stem}--replace-20260914120000.jpg`)).toBe(true);
    expect(isOriginalKeyOf(publicKey, `${stem}0.jpg`)).toBe(false);
    expect(isOriginalKeyOf(publicKey, `${stem}-extra.jpg`)).toBe(false);
    expect(isOriginalKeyOf(publicKey, `${stem}`)).toBe(false);
    expect(isOriginalKeyOf(publicKey, 'uploads/site-media/popty-cara/award-rich-fruit-4243656432c96fd45991.jpg')).toBe(false);
  });
});
