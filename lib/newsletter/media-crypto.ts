import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/media-crypto.ts');

const magic = Buffer.from('VDNM1');

function encryptionKey() {
  const configured = process.env.NEWSLETTER_MEDIA_ENCRYPTION_KEY?.trim();
  const key = Buffer.from(configured || '', 'base64');
  if (!configured || key.length !== 32 || key.toString('base64') !== configured) {
    throw new Error('Newsletter attachments require a dedicated NEWSLETTER_MEDIA_ENCRYPTION_KEY (32 random bytes, base64 encoded).');
  }
  return key;
}

export function encryptNewsletterAttachment(bytes: Buffer, mediaId: string) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), nonce);
  cipher.setAAD(Buffer.from(mediaId));
  const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return Buffer.concat([magic, nonce, cipher.getAuthTag(), ciphertext]);
}

export function decryptNewsletterAttachment(stored: Buffer, mediaId: string) {
  if (stored.length < 34 || !stored.subarray(0, 5).equals(magic)) throw new Error('The frozen attachment has changed or is not encrypted. Delivery was stopped.');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), stored.subarray(5, 17));
  decipher.setAAD(Buffer.from(mediaId));
  decipher.setAuthTag(stored.subarray(17, 33));
  try {
    return Buffer.concat([decipher.update(stored.subarray(33)), decipher.final()]);
  } catch {
    throw new Error('The frozen attachment has changed or cannot be decrypted. Delivery was stopped.');
  }
}
