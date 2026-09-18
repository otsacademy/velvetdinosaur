import { describe, expect, test } from 'bun:test';
import sharp from 'sharp';
import { isTrustedAsset } from '@/lib/assets/ownership.server';
import {
  assertNewsletterMessageSize, createNewsletterImage, detectNewsletterMime,
  normalizeAttachmentKeys, normalizeMediaAssetKey, safeAttachmentName, validateNewsletterAttachment,
} from './media-validation';

describe('newsletter media validation', () => {
  test('rejects bucket keys, traversal, duplicate attachments and too many files', () => {
    for (const key of ['private/document.pdf', 'uploads/../document.pdf', 'uploads/a\\b.pdf', 'uploads//a.pdf']) {
      expect(() => normalizeMediaAssetKey(key)).toThrow();
    }
    expect(() => normalizeAttachmentKeys([{ assetKey: 'uploads/a.pdf' }, { assetKey: 'uploads/a.pdf' }])).toThrow('twice');
    expect(() => normalizeAttachmentKeys(Array.from({ length: 6 }, (_, index) => ({ assetKey: `uploads/${index}.pdf` })))).toThrow('at most 5');
  });

  test('a legacy or foreign asset record never proves newsletter ownership', () => {
    expect(isTrustedAsset({}, 'site-one')).toBe(false);
    expect(isTrustedAsset({ ownerSite: 'site-two', ownershipSource: 'upload' }, 'site-one')).toBe(false);
    expect(isTrustedAsset({ ownerSite: 'site-one', ownershipSource: 'backfill' }, 'site-one')).toBe(false);
    expect(isTrustedAsset({ ownerSite: 'site-one', ownershipSource: 'reviewed-migration' }, 'site-one')).toBe(true);
  });

  test('opaque rendition preserves full portrait and landscape proportions', async () => {
    const landscape = await sharp({ create: { width: 2240, height: 560, channels: 3, background: '#bb3300' } }).jpeg().toBuffer();
    const result = await createNewsletterImage(landscape);
    expect(result.mime).toBe('image/jpeg');
    expect([result.width, result.height]).toEqual([1120, 280]);
    const portrait = await sharp({ create: { width: 300, height: 900, channels: 3, background: '#bb3300' } }).jpeg().toBuffer();
    const small = await createNewsletterImage(portrait);
    expect([small.width, small.height]).toEqual([300, 900]);
  });

  test('transparent images remain PNG and optimized WebP attachments convert safely', async () => {
    const webp = await sharp({ create: { width: 40, height: 20, channels: 4, background: '#aa223344' } }).webp().toBuffer();
    const result = await createNewsletterImage(webp);
    expect(result.mime).toBe('image/png');
    expect((await sharp(result.bytes).metadata()).hasAlpha).toBe(true);
    const attachment = await validateNewsletterAttachment(webp, 'image.webp');
    expect(attachment.name).toBe('image.png');
    expect(attachment.mime).toBe('image/png');
    expect(detectNewsletterMime(attachment.bytes)).toBe('image/png');
  });

  test('rejects unsupported, truncated and oversized attachment bytes', async () => {
    expect(() => detectNewsletterMime(Buffer.from('<html>fake.pdf</html>'))).toThrow();
    await expect(validateNewsletterAttachment(Buffer.from([255, 216, 255, 0, 0]))).rejects.toThrow();
    await expect(validateNewsletterAttachment(Buffer.alloc(5 * 1024 * 1024 + 1))).rejects.toThrow('5 MiB');
    await expect(validateNewsletterAttachment(Buffer.from('%PDF-1.7\ntruncated'))).rejects.toThrow();
  });

  test('safe filenames and encoded message limits include MIME overhead', () => {
    expect(safeAttachmentName('../receipt\r\nBcc:example.pdf', 'application/pdf')).toBe('..-receipt--Bcc-example.pdf');
    expect(() => assertNewsletterMessageSize({ htmlBody: '<p>Hello</p>', textBody: 'Hello', attachments: [{ Name: 'ok.pdf', ContentType: 'application/pdf', Content: 'a'.repeat(7_000_000), ContentID: null }] })).not.toThrow();
    expect(() => assertNewsletterMessageSize({ htmlBody: '<p>Hello</p>', textBody: 'Hello', attachments: [{ Name: 'large.pdf', ContentType: 'application/pdf', Content: 'a'.repeat(9_400_000), ContentID: null }] })).toThrow('encoded');
    expect(() => assertNewsletterMessageSize({ htmlBody: 'a'.repeat(1024 * 1024 + 1), textBody: '' })).toThrow('1 MiB');
  });
});
