import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import sharp from 'sharp';
import * as database from '@/lib/db';
import * as r2 from '@/lib/r2';
import { assetOwnerSite } from '@/lib/assets/ownership.server';
import { Asset } from '@/models/Asset';
import { NewsletterMedia } from '@/models/NewsletterMedia';
import { NewsletterCampaign } from '@/models/NewsletterCampaign';
import { prepareNewsletterMedia, loadNewsletterMedia, selectNewsletterMedia, cleanupNewsletterMedia, retainNewsletterMediaImages } from './media';
import { getNewsletterMediaRecord, readMediaBytes } from './media-storage';
import type { NewsletterMediaRecord } from './media-storage';

const pdf = Buffer.from('%PDF-1.7\n1 0 obj<</Type/Catalog>>endobj\n%%EOF');

// The in-memory fake implements only the query surface used by this module.
// Cast the model facade, not production code or its data contracts.
type MockableModel = Record<'findOne' | 'find' | 'exists' | 'updateOne' | 'findOneAndUpdate' | 'deleteOne', (...args: never[]) => unknown>;
const assetModel = Asset as unknown as MockableModel;
const mediaModel = NewsletterMedia as unknown as MockableModel;
const campaignModel = NewsletterCampaign as unknown as MockableModel;

const priorUri = process.env.MONGODB_URI;
const priorKey = process.env.NEWSLETTER_MEDIA_ENCRYPTION_KEY;
let assets: Map<string, Record<string, unknown>>;
let records: Map<string, NewsletterMediaRecord>;
let objects: Map<string, Buffer>;
let reads: number;
let activeCampaign: boolean;
let putFailure: 'before' | 'after' | null;
let readyFailure: boolean;
let referenceReads: number;
let referenceAppearsAfterClaim: boolean;

function query<T>(value: T) {
  return { lean: () => query(value), exec: async () => value, sort: () => query(value), limit: () => query(value) };
}

beforeEach(() => {
  process.env.MONGODB_URI = 'mongodb://localhost/newsletter-media-test';
  process.env.NEWSLETTER_MEDIA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
  assets = new Map(); records = new Map(); objects = new Map(); reads = 0; activeCampaign = false;
  putFailure = null; readyFailure = false; referenceReads = 0; referenceAppearsAfterClaim = false;
  spyOn(database, 'connectDB').mockResolvedValue({} as Awaited<ReturnType<typeof database.connectDB>>);
  spyOn(assetModel, 'findOne').mockImplementation((filter: { key: string }) => query(assets.get(filter.key) || null));
  spyOn(mediaModel, 'findOne').mockImplementation((filter: { id: string; kind?: string; ownerSite?: string; ready?: boolean }) => {
    const record = records.get(filter.id);
    return query(record && (!filter.kind || filter.kind === record.kind) && (!filter.ownerSite || filter.ownerSite === record.ownerSite) && (filter.ready === undefined || record.ready === filter.ready) ? record : null);
  });
  spyOn(mediaModel, 'updateOne').mockImplementation(async (filter: { id: string; deletingAt?: Date }, update: { $setOnInsert?: NewsletterMediaRecord; $set?: Partial<NewsletterMediaRecord>; $max?: { expiresAt: Date }; $unset?: Record<string, string> }) => {
    if (!records.has(filter.id) && update.$setOnInsert) records.set(filter.id, { ...update.$setOnInsert });
    const record = records.get(filter.id);
    if (record?.deletingAt && filter.deletingAt !== record.deletingAt) return { matchedCount: 0 };
    if (update.$set?.ready && readyFailure) throw new Error('Simulated database interruption after PUT.');
    if (record && update.$set) Object.assign(record, update.$set);
    if (record && update.$max?.expiresAt && (!record.expiresAt || record.expiresAt < update.$max.expiresAt)) record.expiresAt = update.$max.expiresAt;
    if (record && update.$unset?.expiresAt != null) delete record.expiresAt;
    if (record && update.$unset?.writingUntil != null) delete record.writingUntil;
    if (record && update.$unset?.deletingAt != null) delete record.deletingAt;
    return { matchedCount: record ? 1 : 0 };
  });
  spyOn(mediaModel, 'find').mockImplementation(() => query([...records.values()]));
  spyOn(campaignModel, 'exists').mockImplementation(async () => {
    referenceReads += 1;
    return activeCampaign || (referenceAppearsAfterClaim && referenceReads > 1) ? { _id: 'campaign' } : null;
  });
  spyOn(mediaModel, 'findOneAndUpdate').mockImplementation((filter: { id: string }, update: { $set: Partial<NewsletterMediaRecord> }) => {
    const record = records.get(filter.id);
    if (record) Object.assign(record, update.$set);
    return query(record || null);
  });
  spyOn(mediaModel, 'deleteOne').mockImplementation(async (filter: { id: string }) => { records.delete(filter.id); });
  spyOn(r2, 'getR2Client').mockReturnValue({ destroy: () => undefined, send: async (command: GetObjectCommand | PutObjectCommand | DeleteObjectCommand) => {
    const key = String(command.input.Key);
    if (command instanceof PutObjectCommand) {
      expect([...records.values()].some((record) => record.storageKey === key)).toBe(true);
      if (putFailure === 'before') throw new Error('Simulated interrupted PUT.');
      if (objects.has(key)) throw Object.assign(new Error('Object already exists.'), { $metadata: { httpStatusCode: 412 } });
      objects.set(key, Buffer.from(command.input.Body as Uint8Array));
      if (putFailure === 'after') throw new Error('Simulated lost PUT response.');
      return {};
    }
    if (command instanceof DeleteObjectCommand) { objects.delete(key); return {}; }
    reads += 1;
    const bytes = objects.get(key);
    if (!bytes) throw new Error('Required storage file is missing.');
    return { ContentLength: bytes.length, Body: Readable.from([bytes]) };
  } } as unknown as ReturnType<typeof r2.getR2Client>);
});

afterEach(() => {
  mock.restore();
  if (priorUri === undefined) delete process.env.MONGODB_URI;
  else process.env.MONGODB_URI = priorUri;
  if (priorKey === undefined) delete process.env.NEWSLETTER_MEDIA_ENCRYPTION_KEY;
  else process.env.NEWSLETTER_MEDIA_ENCRYPTION_KEY = priorKey;
});

function addAsset(key: string, bytes: Buffer = pdf) {
  assets.set(key, { key, bucket: 'shared-bucket', ownerSite: assetOwnerSite(), ownershipSource: 'upload', name: 'Newsletter file' });
  objects.set(key, bytes);
}

describe('bounded newsletter storage reads', () => {
  function storage(send: (command: GetObjectCommand, options: { abortSignal: AbortSignal }) => Promise<{ Body?: Readable; ContentLength?: number }>) {
    const destroy = mock(() => undefined);
    spyOn(r2, 'getR2Client').mockReturnValue({ send, destroy } as unknown as ReturnType<typeof r2.getR2Client>);
    return destroy;
  }

  test('a stalled response stream times out and releases the request, body and client', async () => {
    const body = new Readable({ read() {} });
    body.push(Buffer.from('partial'));
    let signal: AbortSignal | undefined;
    const destroy = storage(async (_command, options) => {
      signal = options.abortSignal;
      return { Body: body, ContentLength: 100 };
    });
    const started = Date.now();
    await expect(readMediaBytes('bucket', 'uploads/stalled.pdf', 1024, 20)).rejects.toThrow('timed out');
    expect(Date.now() - started).toBeLessThan(1000);
    expect(signal?.aborted).toBe(true);
    expect(body.destroyed).toBe(true);
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  test('the deadline also covers stalled response headers and destroys any late body', async () => {
    let release: ((response: { Body: Readable }) => void) | undefined;
    let signal: AbortSignal | undefined;
    const destroy = storage((_command, options) => {
      signal = options.abortSignal;
      return new Promise((resolve) => { release = resolve; });
    });
    await expect(readMediaBytes('bucket', 'uploads/stalled.pdf', 1024, 20)).rejects.toThrow('timed out');
    expect(signal?.aborted).toBe(true);
    expect(destroy).toHaveBeenCalledTimes(1);
    const body = new Readable({ read() {} });
    release!({ Body: body });
    await Promise.resolve();
    expect(body.destroyed).toBe(true);
  });

  test.each([5, 3])('rejects oversized headers or streamed bytes and cleans up (declared size %s)', async (declaredSize) => {
    const body = Readable.from([Buffer.from('12345')]);
    let signal: AbortSignal | undefined;
    const destroy = storage(async (_command, options) => {
      signal = options.abortSignal;
      return { Body: body, ContentLength: declaredSize };
    });
    await expect(readMediaBytes('bucket', 'uploads/large.pdf', 4, 100)).rejects.toThrow('too large');
    expect(signal?.aborted).toBe(true);
    expect(body.destroyed).toBe(true);
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});

describe('newsletter media preparation and retention', () => {
  test('rejects missing, backfilled and cross-site assets without reading shared storage', async () => {
    for (const source of [undefined, { key: 'uploads/foreign.pdf', bucket: 'shared-bucket' }, { key: 'uploads/foreign.pdf', bucket: 'shared-bucket', ownerSite: 'foreign', ownershipSource: 'upload' }]) {
      if (source) assets.set('uploads/foreign.pdf', source);
      await expect(selectNewsletterMedia('uploads/foreign.pdf', 'attachment')).rejects.toThrow('verified ownership');
    }
    expect(reads).toBe(0);
  });

  test('freezes attachment bytes and loads the same snapshot after source replacement or purge', async () => {
    addAsset('uploads/brief.pdf');
    const prepared = await prepareNewsletterMedia({ htmlBody: '<p>Brief attached</p>', campaignId: 'campaign-1', attachments: [{ assetKey: 'uploads/brief.pdf', name: 'forged.exe', mime: 'text/plain', size: 1 }] });
    expect(prepared.attachments[0].ContentType).toBe('application/pdf');
    expect(prepared.attachments[0].Name).toBe('Newsletter file.pdf');
    expect(Buffer.from(prepared.attachments[0].Content, 'base64')).toEqual(pdf);
    expect(reads).toBe(1);
    const snapshot = records.get(prepared.manifest.attachments[0].id)!;
    expect(snapshot.storageKey.startsWith('newsletter-private/')).toBe(true);
    expect(objects.get(snapshot.storageKey)?.includes(pdf)).toBe(false);
    expect(snapshot.expiresAt).toBeUndefined();
    assets.clear(); objects.delete('uploads/brief.pdf');
    const loaded = await loadNewsletterMedia(prepared.manifest);
    expect(loaded.attachments).toEqual(prepared.attachments);
    await expect(getNewsletterMediaRecord(snapshot.id, 'image')).rejects.toThrow('unavailable');
  });

  test('freezes images without uploads records and retains them through source purge', async () => {
    const source = await sharp({ create: { width: 40, height: 20, channels: 3, background: '#225588' } }).webp().toBuffer();
    addAsset('uploads/photo.webp', source);
    const item = await selectNewsletterMedia('uploads/photo.webp', 'image');
    const prepared = await prepareNewsletterMedia({ htmlBody: `<img src="${item.url}" alt="Example">`, visualBody: [{ type: 'img', assetKey: item.assetKey, renditionId: item.renditionId }], campaignId: 'campaign-1' });
    expect(prepared.htmlBody).toBe(`<img src="${item.url}" alt="Example">`);
    const record = records.get(item.renditionId!)!;
    expect(record.retained).toBe(true);
    expect(record.expiresAt).toBeUndefined();
    expect(record.storageKey.startsWith('newsletter-images/')).toBe(true);
    assets.clear(); objects.delete('uploads/photo.webp');
    await expect(loadNewsletterMedia(prepared.manifest)).resolves.toEqual({ attachments: [] });
  });

  test('missing snapshots and checksum changes fail before delivery', async () => {
    addAsset('uploads/brief.pdf');
    const prepared = await prepareNewsletterMedia({ htmlBody: '<p>Hello</p>', attachments: [{ assetKey: 'uploads/brief.pdf', name: '', mime: '', size: 0 }] });
    const record = records.get(prepared.manifest.attachments[0].id)!;
    objects.set(record.storageKey, Buffer.from('changed'));
    await expect(loadNewsletterMedia(prepared.manifest)).rejects.toThrow('has changed');
    objects.delete(record.storageKey);
    await expect(loadNewsletterMedia(prepared.manifest)).rejects.toThrow('missing');
  });

  test('preview images stay temporary; actual test sending retains images while attachments still expire', async () => {
    const source = await sharp({ create: { width: 30, height: 20, channels: 3, background: '#225588' } }).png().toBuffer();
    addAsset('uploads/photo.png', source);
    addAsset('uploads/brief.pdf');
    const image = await selectNewsletterMedia('uploads/photo.png', 'image');
    const prepared = await prepareNewsletterMedia({ htmlBody: `<img src="${image.url}" alt="Example">`, attachments: [{ assetKey: 'uploads/brief.pdf', name: '', mime: '', size: 0 }] });
    const imageRecord = records.get(image.renditionId!)!;
    const attachmentRecord = records.get(prepared.manifest.attachments[0].id)!;
    expect(imageRecord.retained).not.toBe(true);
    expect(imageRecord.expiresAt).toBeInstanceOf(Date);
    const attachmentExpiry = attachmentRecord.expiresAt?.getTime();
    await retainNewsletterMediaImages(prepared.manifest);
    expect(imageRecord.retained).toBe(true);
    expect(imageRecord.expiresAt).toBeUndefined();
    expect(attachmentRecord.retained).not.toBe(true);
    expect(attachmentRecord.expiresAt?.getTime()).toBe(attachmentExpiry);
  });

  test('cleanup dry-run performs no mutations and active campaign refs protect snapshots', async () => {
    addAsset('uploads/brief.pdf');
    const prepared = await prepareNewsletterMedia({ htmlBody: '<p>Hello</p>', attachments: [{ assetKey: 'uploads/brief.pdf', name: '', mime: '', size: 0 }] });
    const record = records.get(prepared.manifest.attachments[0].id)!;
    record.expiresAt = new Date(0);
    expect(await cleanupNewsletterMedia({ dryRun: true })).toEqual({ eligible: 1, removed: 0, failed: 0, dryRun: true });
    expect(records.size).toBe(1); expect(objects.has(record.storageKey)).toBe(true);
    activeCampaign = true;
    expect((await cleanupNewsletterMedia()).removed).toBe(0);
    activeCampaign = false;
    expect((await cleanupNewsletterMedia()).removed).toBe(1);
    expect(objects.has(record.storageKey)).toBe(false);
  });

  test('interrupted writes leave a pending intent and retry without replacing stored ciphertext', async () => {
    addAsset('uploads/brief.pdf');
    const input = { htmlBody: '<p>Hello</p>', attachments: [{ assetKey: 'uploads/brief.pdf', name: '', mime: '', size: 0 }] };
    putFailure = 'before';
    await expect(prepareNewsletterMedia(input)).rejects.toThrow('interrupted PUT');
    const record = [...records.values()][0];
    expect(record.ready).toBe(false);
    expect(objects.has(record.storageKey)).toBe(false);
    await expect(getNewsletterMediaRecord(record.id, 'attachment')).rejects.toThrow('unavailable');
    putFailure = 'after';
    await expect(prepareNewsletterMedia(input)).rejects.toThrow('lost PUT response');
    const ciphertext = objects.get(record.storageKey)!;
    putFailure = null;
    readyFailure = true;
    await expect(prepareNewsletterMedia(input)).rejects.toThrow('database interruption');
    expect(record.ready).toBe(false);
    readyFailure = false;
    const prepared = await prepareNewsletterMedia(input);
    expect(record.ready).toBe(true);
    expect(objects.get(record.storageKey)).toEqual(ciphertext);
    expect(Buffer.from(prepared.attachments[0].Content, 'base64')).toEqual(pdf);
    expect(records.size).toBe(1);
  });

  test('reused temporary attachments refresh retention and cleanup releases a raced claim', async () => {
    addAsset('uploads/brief.pdf');
    const input = { htmlBody: '<p>Hello</p>', attachments: [{ assetKey: 'uploads/brief.pdf', name: '', mime: '', size: 0 }] };
    const prepared = await prepareNewsletterMedia(input);
    const record = records.get(prepared.manifest.attachments[0].id)!;
    record.expiresAt = new Date(0);
    await prepareNewsletterMedia(input);
    expect(record.expiresAt!.getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000);
    record.expiresAt = new Date(0);
    referenceAppearsAfterClaim = true;
    expect((await cleanupNewsletterMedia()).removed).toBe(0);
    expect(record.deletingAt).toBeUndefined();
    expect(objects.has(record.storageKey)).toBe(true);
  });
});
