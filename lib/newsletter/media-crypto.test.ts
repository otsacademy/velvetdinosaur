import { afterEach, beforeEach, expect, test } from 'bun:test';
import { decryptNewsletterAttachment, encryptNewsletterAttachment } from './media-crypto';

const priorKey = process.env.NEWSLETTER_MEDIA_ENCRYPTION_KEY;
beforeEach(() => { process.env.NEWSLETTER_MEDIA_ENCRYPTION_KEY = Buffer.alloc(32, 3).toString('base64'); });
afterEach(() => {
  if (priorKey === undefined) delete process.env.NEWSLETTER_MEDIA_ENCRYPTION_KEY;
  else process.env.NEWSLETTER_MEDIA_ENCRYPTION_KEY = priorKey;
});

test('snapshots encrypt with distinct nonces and authenticated media identity', () => {
  const plaintext = Buffer.from('private newsletter document');
  const first = encryptNewsletterAttachment(plaintext, 'media-one');
  const second = encryptNewsletterAttachment(plaintext, 'media-one');
  expect(first.equals(second)).toBe(false);
  expect(first.includes(plaintext)).toBe(false);
  expect(decryptNewsletterAttachment(first, 'media-one')).toEqual(plaintext);
  expect(() => decryptNewsletterAttachment(first, 'media-two')).toThrow('cannot be decrypted');
  first[first.length - 1] ^= 1;
  expect(() => decryptNewsletterAttachment(first, 'media-one')).toThrow('has changed');
});

test('missing or malformed dedicated encryption key fails closed', () => {
  delete process.env.NEWSLETTER_MEDIA_ENCRYPTION_KEY;
  expect(() => encryptNewsletterAttachment(Buffer.from('private'), 'media')).toThrow('dedicated');
  process.env.NEWSLETTER_MEDIA_ENCRYPTION_KEY = 'short';
  expect(() => encryptNewsletterAttachment(Buffer.from('private'), 'media')).toThrow('32 random bytes');
});
