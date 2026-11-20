import sharp from 'sharp';
import { validateAssetBytes } from './file-safety';

export async function rasterizeSafeSvg(body: Buffer) {
  await validateAssetBytes(body, 'image/svg+xml');
  return sharp(body, { limitInputPixels: 40_000_000 }).resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).png().toBuffer();
}
