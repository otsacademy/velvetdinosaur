import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client } from '@/lib/r2';

export async function createPresignedUpload({
  bucket,
  key,
  contentType
}: {
  bucket: string;
  key: string;
  contentType: string;
}) {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentDisposition: 'attachment'
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
  return uploadUrl;
}

export async function createPresignedDownload({
  bucket,
  key
}: {
  bucket: string;
  key: string;
}) {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: 'attachment',
    ResponseContentType: 'application/octet-stream'
  });
  const url = await getSignedUrl(client, command, { expiresIn: 900 });
  return url;
}
