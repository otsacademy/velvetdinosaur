import { PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { assertServerOnly } from '@/lib/_server/guard';
import {
  ASSET_IMAGE_VARIANT_NAMES,
  ASSET_IMAGE_VARIANTS,
  buildVariantKey,
  getMimeForVariantFormat,
  isOptimizableImageMime,
  type AssetImageVariantMap,
  type AssetImageVariantName,
  type AssetImageVariantRecord
} from '@/lib/assets/image-variants';

assertServerOnly('lib/assets/image-pipeline.server.ts');

const PUBLIC_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const PRIVATE_ORIGINAL_CACHE_CONTROL = 'private, max-age=0, no-store';

export type AssetProcessingStatus = 'processed' | 'passthrough' | 'failed';

export type StoredAssetResult = {
  originalKey: string;
  originalMime: string;
  originalSize: number;
  key: string;
  fallbackKey: string;
  mime: string;
  size: number;
  optimizedSize: number;
  etag?: string;
  width?: number;
  height?: number;
  processingStatus: AssetProcessingStatus;
  processedAt: Date;
  variants?: AssetImageVariantMap;
};

type StoreAssetInput = {
  client: S3Client;
  bucket: string;
  publicKey: string;
  originalKey: string;
  body: Buffer;
  contentType: string;
  preservePublicKey?: boolean;
};

async function putObject(input: {
  client: S3Client;
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl: string;
}) {
  const result = await input.client.send(
    new PutObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl
    })
  );
  return result.ETag;
}

async function renderVariant(body: Buffer, variantName: AssetImageVariantName) {
  const config = ASSET_IMAGE_VARIANTS[variantName];
  let transformer = sharp(body, { failOn: 'none' })
    .rotate()
    .resize({
      width: config.width,
      height: config.height,
      fit: config.fit,
      position: 'centre',
      withoutEnlargement: config.fit === 'inside'
    });

  if (config.format === 'jpeg') {
    transformer = transformer.flatten({ background: '#ffffff' }).jpeg({
      quality: config.quality,
      mozjpeg: true
    });
  } else if (config.format === 'png') {
    transformer = transformer.png({
      quality: config.quality,
      compressionLevel: 9
    });
  } else if (config.format === 'avif') {
    transformer = transformer.avif({
      quality: config.quality,
      effort: 5
    });
  } else {
    transformer = transformer.webp({
      quality: config.quality,
      effort: 4
    });
  }

  const output = await transformer.toBuffer({ resolveWithObject: true });
  return {
    body: output.data,
    width: output.info.width,
    height: output.info.height,
    mime: getMimeForVariantFormat(config.format),
    config
  };
}

export async function storeAssetWithVariants(input: StoreAssetInput): Promise<StoredAssetResult> {
  const contentType = input.contentType || 'application/octet-stream';
  const processedAt = new Date();

  await putObject({
    client: input.client,
    bucket: input.bucket,
    key: input.originalKey,
    body: input.body,
    contentType,
    cacheControl: PRIVATE_ORIGINAL_CACHE_CONTROL
  });

  if (!isOptimizableImageMime(contentType)) {
    const etag = input.preservePublicKey
      ? undefined
      : await putObject({
          client: input.client,
          bucket: input.bucket,
          key: input.publicKey,
          body: input.body,
          contentType,
          cacheControl: PUBLIC_CACHE_CONTROL
        });

    return {
      originalKey: input.originalKey,
      originalMime: contentType,
      originalSize: input.body.byteLength,
      key: input.publicKey,
      fallbackKey: input.publicKey,
      mime: contentType,
      size: input.body.byteLength,
      optimizedSize: input.body.byteLength,
      etag,
      processingStatus: 'passthrough',
      processedAt
    };
  }

  const source = await sharp(input.body, { failOn: 'none' }).rotate().metadata();
  const variants: AssetImageVariantMap = {};
  let fallbackEtag: string | undefined;

  for (const variantName of ASSET_IMAGE_VARIANT_NAMES) {
    const rendered = await renderVariant(input.body, variantName);
    const key = buildVariantKey(input.publicKey, variantName, {
      inlineAsPublicKey: input.preservePublicKey !== true
    });
    const etag = await putObject({
      client: input.client,
      bucket: input.bucket,
      key,
      body: rendered.body,
      contentType: rendered.mime,
      cacheControl: PUBLIC_CACHE_CONTROL
    });

    const record: AssetImageVariantRecord = {
      key,
      width: rendered.width,
      height: rendered.height,
      mime: rendered.mime,
      size: rendered.body.byteLength,
      format: rendered.config.format,
      quality: rendered.config.quality,
      fit: rendered.config.fit
    };
    variants[variantName] = record;
    if (variantName === 'inline') {
      fallbackEtag = etag;
    }
  }

  const fallback = variants.inline;
  if (!fallback) {
    throw new Error('Inline image variant was not generated.');
  }

  return {
    originalKey: input.originalKey,
    originalMime: contentType,
    originalSize: input.body.byteLength,
    key: input.preservePublicKey ? input.publicKey : fallback.key,
    fallbackKey: input.preservePublicKey ? input.publicKey : fallback.key,
    mime: input.preservePublicKey ? contentType : fallback.mime,
    size: input.preservePublicKey ? input.body.byteLength : fallback.size,
    optimizedSize: fallback.size,
    etag: fallbackEtag,
    width: source.width,
    height: source.height,
    processingStatus: 'processed',
    processedAt,
    variants
  };
}
