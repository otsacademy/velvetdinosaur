import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from 'node:fs';
import { dirname } from 'node:path';

export const RECIPIENT_REGISTRY_VERSION = 1;
export const DEFAULT_RECIPIENT_REGISTRY_FILE =
  process.env.VD_ACTIVITY_RECIPIENT_REGISTRY ||
  '/var/lib/vd-demo-activity-digest/recipients.json';
export const DEFAULT_RECIPIENT_SECRET_FILE =
  process.env.VD_ACTIVITY_RECIPIENT_SECRET_FILE ||
  '/var/lib/vd-demo-activity-digest/recipient-link-secret';

export type RecipientLinkRecord = {
  id: string;
  siteSlug: string;
  name: string;
  email: string;
  createdAt: string;
  expiresAt: string;
};

export type RecipientLinkRegistry = {
  version: 1;
  recipients: RecipientLinkRecord[];
};

export type RecipientTokenPayload = {
  v: 1;
  r: string;
  s: string;
  e: number;
};

function base64Url(value: Buffer | string) {
  return Buffer.from(value).toString('base64url');
}

function signature(encodedPayload: string, secret: string) {
  return createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

export function createRecipientToken(
  record: Pick<RecipientLinkRecord, 'id' | 'siteSlug' | 'expiresAt'>,
  secret: string
) {
  const expiresAt = Date.parse(record.expiresAt);
  if (!record.id || !record.siteSlug || !Number.isFinite(expiresAt)) {
    throw new Error('Recipient link record is invalid.');
  }
  const payload: RecipientTokenPayload = {
    v: 1,
    r: record.id,
    s: record.siteSlug,
    e: Math.floor(expiresAt / 1000)
  };
  const encodedPayload = base64Url(JSON.stringify(payload));
  return `v1.${encodedPayload}.${signature(encodedPayload, secret)}`;
}

export function verifyRecipientToken(token: string, secret: string, now = new Date()) {
  const match = token.match(/^v1\.([A-Za-z0-9_-]{16,512})\.([A-Za-z0-9_-]{16,128})$/);
  if (!match || !secret) return null;
  const expected = Buffer.from(signature(match[1], secret));
  const supplied = Buffer.from(match[2]);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(match[1], 'base64url').toString('utf8')) as RecipientTokenPayload;
    if (
      parsed.v !== 1 ||
      typeof parsed.r !== 'string' ||
      !parsed.r ||
      typeof parsed.s !== 'string' ||
      !parsed.s ||
      !Number.isInteger(parsed.e) ||
      parsed.e * 1000 < now.getTime()
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readRecipientRegistry(file = DEFAULT_RECIPIENT_REGISTRY_FILE): RecipientLinkRegistry {
  if (!existsSync(file)) return { version: RECIPIENT_REGISTRY_VERSION, recipients: [] };
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as RecipientLinkRegistry;
    if (parsed.version !== 1 || !Array.isArray(parsed.recipients)) throw new Error('Invalid registry');
    return parsed;
  } catch {
    throw new Error(`Recipient link registry is invalid: ${file}`);
  }
}

export function writeRecipientRegistry(
  registry: RecipientLinkRegistry,
  file = DEFAULT_RECIPIENT_REGISTRY_FILE
) {
  mkdirSync(dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(registry, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, file);
}

export function readOrCreateRecipientSecret(file = DEFAULT_RECIPIENT_SECRET_FILE) {
  if (existsSync(file)) {
    const value = readFileSync(file, 'utf8').trim();
    if (value.length < 32) throw new Error(`Recipient link secret is invalid: ${file}`);
    return value;
  }
  mkdirSync(dirname(file), { recursive: true });
  const value = randomBytes(32).toString('base64url');
  writeFileSync(file, `${value}\n`, { mode: 0o600, flag: 'wx' });
  return value;
}
