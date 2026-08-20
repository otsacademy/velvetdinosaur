import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/storage/review-screenshots.ts');

import crypto from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const MAX_SCREENSHOT_BYTES = 1.5 * 1024 * 1024;
const WEBP_SIGNATURE_RIFF = 'RIFF';
const WEBP_SIGNATURE_WEBP = 'WEBP';
const PNG_SIGNATURE_HEX = '89504e470d0a1a0a';

type SupportedScreenshotMimeType = 'image/webp' | 'image/png' | 'image/jpeg';

function ensureBuffer(input: Buffer | Uint8Array | ArrayBuffer) {
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof Uint8Array) return Buffer.from(input);
  if (input instanceof ArrayBuffer) return Buffer.from(input);
  throw new Error('Invalid screenshot buffer');
}

function isValidWebp(buffer: Buffer) {
  if (buffer.length < 12) return false;
  const riff = buffer.subarray(0, 4).toString('ascii');
  const webp = buffer.subarray(8, 12).toString('ascii');
  return riff === WEBP_SIGNATURE_RIFF && webp === WEBP_SIGNATURE_WEBP;
}

function isValidPng(buffer: Buffer) {
  if (buffer.length < 8) return false;
  const header = buffer.subarray(0, 8).toString('hex');
  return header === PNG_SIGNATURE_HEX;
}

function isValidJpeg(buffer: Buffer) {
  if (buffer.length < 4) return false;
  return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9;
}

function buildSecureFilename(extension: string) {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(16).toString('hex');
  return `${timestamp}-${random}.${extension}`;
}

function validateScreenshotType(buffer: Buffer, mimeType: SupportedScreenshotMimeType) {
  if (mimeType === 'image/webp') return isValidWebp(buffer);
  if (mimeType === 'image/png') return isValidPng(buffer);
  return isValidJpeg(buffer);
}

function resolveExtension(mimeType: SupportedScreenshotMimeType) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/jpeg') return 'jpg';
  return 'webp';
}

export async function saveScreenshot(
  input: Buffer | Uint8Array | ArrayBuffer,
  mimeType: SupportedScreenshotMimeType = 'image/webp'
) {
  const buffer = ensureBuffer(input);
  if (buffer.byteLength === 0) {
    throw new Error('Screenshot payload is empty');
  }
  if (buffer.byteLength > MAX_SCREENSHOT_BYTES) {
    throw new Error('Screenshot exceeds 1.5MB max size');
  }
  if (!validateScreenshotType(buffer, mimeType)) {
    throw new Error(`Screenshot payload does not match ${mimeType}`);
  }

  const outputDir = path.join(process.cwd(), 'public', 'review-screenshots');
  await mkdir(outputDir, { recursive: true });
  const filename = buildSecureFilename(resolveExtension(mimeType));
  const absolutePath = path.join(outputDir, filename);
  await writeFile(absolutePath, buffer, { mode: 0o644 });
  return `/review-screenshots/${filename}`;
}
