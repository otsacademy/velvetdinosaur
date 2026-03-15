import path from 'path';
import { readFile } from 'fs/promises';

function contentTypeForAsset(assetPath: string) {
  const ext = path.extname(assetPath).toLowerCase();

  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

export async function getPublicAssetDataUri(assetPath: string) {
  const absolutePath = path.join(process.cwd(), 'public', assetPath);
  const buffer = await readFile(absolutePath);
  const contentType = contentTypeForAsset(assetPath);
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}
