import { createHash } from 'node:crypto'
import path from 'node:path'

import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

import { assertServerOnly } from '@/lib/_server/guard'
import { connectDB } from '@/lib/db'
import {
  type ParsedInlineImage,
  InlineMediaError,
  rewriteInlineMediaReferences,
} from '@/lib/inline-media'
import { getR2Client } from '@/lib/r2'
import { slugToPathname } from '@/lib/site-pages'
import { Asset } from '@/models/Asset'
import { AssetFolder } from '@/models/AssetFolder'

assertServerOnly('lib/inline-media.server.ts')

export class InlineMediaValidationError extends Error {
  status = 400

  constructor(message: string, public readonly path?: string) {
    super(message)
    this.name = 'InlineMediaValidationError'
  }
}

type InlineUploadContext = {
  folder: string
  label: string
}

type InlineUploadStats = {
  dataImages: number
  decodedBytes: number
  rewritten: number
  uploadsCreated: number
  uploadsReused: number
  assetRecordsUpserted: number
}

export type InlineStorageRewriteResult<T> = {
  value: T
  changed: boolean
  stats: InlineUploadStats
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
}

const MIME_TO_NAME: Record<string, string> = {
  'image/jpeg': 'inline-image.jpg',
  'image/jpg': 'inline-image.jpg',
  'image/png': 'inline-image.png',
  'image/gif': 'inline-image.gif',
  'image/webp': 'inline-image.webp',
  'image/svg+xml': 'inline-image.svg',
  'image/avif': 'inline-image.avif',
}

function normalizeFolderPath(raw: string) {
  return raw
    .replace(/\\/g, '/')
    .split('/')
    .map((part) =>
      part
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-+|-+$)/g, ''),
    )
    .filter(Boolean)
    .join('/')
}

function folderToLabel(folder: string) {
  return folder
    .split('/')
    .filter(Boolean)
    .map((part) =>
      part
        .split('-')
        .filter(Boolean)
        .map((word) => `${word[0]?.toUpperCase() || ''}${word.slice(1)}`)
        .join(' '),
    )
    .join(' / ')
}

function slugifyName(value: string) {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
  return cleaned || 'inline-image'
}

function buildAssetUrl(key: string) {
  return `/api/assets/file?key=${encodeURIComponent(key)}`
}

function keyForInlineAsset(folder: string, fileNameHint: string, bytes: Buffer, mimeType: string) {
  const ext = MIME_TO_EXT[mimeType] || path.extname(fileNameHint).toLowerCase()
  if (!ext) return null
  const hash = createHash('sha1').update(bytes).digest('hex').slice(0, 12)
  const cleanFolder = normalizeFolderPath(folder)
  const prefix = cleanFolder ? `${cleanFolder}/` : ''
  return `uploads/${prefix}${slugifyName(fileNameHint)}-${hash}${ext}`
}

async function readImageDimensions(bytes: Buffer, mimeType: string) {
  if (!mimeType.startsWith('image/')) {
    return { width: undefined as number | undefined, height: undefined as number | undefined }
  }

  try {
    const metadata = await sharp(bytes, { failOn: 'none' }).metadata()
    return {
      width: typeof metadata.width === 'number' ? metadata.width : undefined,
      height: typeof metadata.height === 'number' ? metadata.height : undefined,
    }
  } catch {
    return { width: undefined, height: undefined }
  }
}

function isNotFoundError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const typed = error as {
    $metadata?: { httpStatusCode?: number }
    name?: string
    code?: string
    Code?: string
  }
  if (typed.$metadata?.httpStatusCode === 404) return true
  const code = typed.Code || typed.code || typed.name
  return code === 'NoSuchKey' || code === 'NotFound' || code === 'NoSuchBucket'
}

async function r2ObjectExists(bucket: string, key: string) {
  const client = getR2Client()
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch (error) {
    if (isNotFoundError(error)) return false
    throw error
  }
}

async function ensureFolderRecord(folder: string) {
  if (!folder) return
  await AssetFolder.findOneAndUpdate(
    { path: folder },
    { $setOnInsert: { path: folder, label: folderToLabel(folder) || folder } },
    { upsert: true },
  ).exec()
}

async function persistParsedInlineImage(
  parsed: Extract<ParsedInlineImage, { ok: true }>,
  context: InlineUploadContext,
  bucket: string,
  stats: InlineUploadStats,
) {
  const bytes = Buffer.from(parsed.bytes)
  const fileNameHint = MIME_TO_NAME[parsed.mimeType] || `inline-image${parsed.extension}`
  const folder = normalizeFolderPath(context.folder)
  const key = keyForInlineAsset(folder, fileNameHint, bytes, parsed.mimeType)
  if (!key) {
    throw new InlineMediaValidationError('Inline image type is not supported.')
  }

  const exists = await r2ObjectExists(bucket, key)
  let etag: string | undefined

  if (!exists) {
    const result = await getR2Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: bytes,
        ContentType: parsed.mimeType,
      }),
    )
    stats.uploadsCreated += 1
    etag = typeof result.ETag === 'string' ? result.ETag : undefined
  } else {
    stats.uploadsReused += 1
  }

  const conn = await connectDB()
  if (!conn) {
    throw new InlineMediaValidationError('Database unavailable while storing inline media.')
  }
  const dimensions = await readImageDimensions(bytes, parsed.mimeType)
  await Asset.findOneAndUpdate(
    { key },
    {
      $set: {
        key,
        bucket,
        folder,
        name: path.basename(fileNameHint, path.extname(fileNameHint)),
        mime: parsed.mimeType,
        size: bytes.byteLength,
        etag,
        width: dimensions.width,
        height: dimensions.height,
      },
    },
    { upsert: true, setDefaultsOnInsert: true },
  ).exec()
  stats.assetRecordsUpserted += 1
  await ensureFolderRecord(folder)

  return buildAssetUrl(key)
}

function toValidationError(error: unknown) {
  if (error instanceof InlineMediaValidationError) return error
  if (error instanceof InlineMediaError) {
    return new InlineMediaValidationError(error.message, error.path)
  }
  return error
}

export function folderForPageInlineMedia(slug: string) {
  const pathname = slugToPathname(slug) || (slug === 'home' ? '/' : `/${slug}`)
  const withoutLeadingSlash = pathname.replace(/^\/+/, '')
  return normalizeFolderPath(withoutLeadingSlash || 'home')
}

export async function rewriteInlineMediaForStorage<T>(
  input: T,
  context: InlineUploadContext,
): Promise<InlineStorageRewriteResult<T>> {
  const bucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME
  const stats: InlineUploadStats = {
    dataImages: 0,
    decodedBytes: 0,
    rewritten: 0,
    uploadsCreated: 0,
    uploadsReused: 0,
    assetRecordsUpserted: 0,
  }

  try {
    if (!bucket) {
      await rewriteInlineMediaReferences(input, async () => {
        throw new InlineMediaValidationError(
          'Inline image data URLs cannot be saved because R2 is not configured. Upload the image to the media library first.',
        )
      })
      return { value: input, changed: false, stats }
    }

    const rewritten = await rewriteInlineMediaReferences(
      input,
      async (_value, parsed) => persistParsedInlineImage(parsed, context, bucket, stats),
      {
        cache: new Map<string, string>(),
      },
    )

    stats.dataImages += rewritten.dataImages
    stats.decodedBytes += rewritten.decodedBytes
    stats.rewritten += rewritten.rewritten

    return {
      value: rewritten.value,
      changed: rewritten.changed,
      stats,
    }
  } catch (error) {
    throw toValidationError(error)
  }
}
