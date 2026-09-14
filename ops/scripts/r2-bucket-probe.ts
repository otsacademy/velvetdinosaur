// ops/scripts/r2-bucket-probe.ts — prove a site's R2 env can write, read and delete
// in its configured bucket: the exact chain /api/assets/upload depends on. Two demos
// shipped with the installer's per-site bucket name instead of the shared bucket and
// every upload failed with AccessDenied (customer test, 13 Sep 2026).
//
//   cd /srv/apps/velvetdinosaur && \
//   bun --env-file=/srv/apps/<slug>/.env.production ops/scripts/r2-bucket-probe.ts
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const bucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME || '';
const endpoint = process.env.R2_ENDPOINT || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const key = `uploads/_probe/${new Date().toISOString().replace(/[^0-9]/g, '')}-${process.pid}.txt`;

function report(result: Record<string, unknown>) {
  console.log(JSON.stringify({ bucket, key, ...result }));
}

if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
  report({ ok: false, error: 'R2 configuration missing (R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)' });
  process.exit(1);
}

const client = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId, secretAccessKey } });
try {
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: 'probe', ContentType: 'text/plain' }));
  await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  report({ ok: true });
} catch (error) {
  const typed = error as { name?: string; Code?: string; message?: string; $metadata?: { httpStatusCode?: number } };
  report({ ok: false, code: typed.Code || typed.name, status: typed.$metadata?.httpStatusCode, error: typed.message });
  process.exit(1);
}
