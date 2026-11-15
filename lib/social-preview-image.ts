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

type SocialPreviewFont = {
  name: string;
  data: Buffer;
  weight: 500 | 600;
  style: 'normal' | 'italic';
};

// next/og cannot use the site's web fonts, so the social preview loads static
// copies of the same faces from /public/fonts/og.
const SOCIAL_PREVIEW_FONTS = [
  { name: 'Newsreader', file: 'Newsreader-Medium.ttf', weight: 500, style: 'normal' },
  { name: 'Newsreader', file: 'Newsreader-MediumItalic.ttf', weight: 500, style: 'italic' },
  { name: 'Source Sans 3', file: 'SourceSans3-SemiBold.ttf', weight: 600, style: 'normal' },
] as const;

export async function getSocialPreviewFonts(): Promise<SocialPreviewFont[]> {
  return Promise.all(
    SOCIAL_PREVIEW_FONTS.map(async (font) => ({
      name: font.name,
      data: await readFile(path.join(process.cwd(), 'public', 'fonts', 'og', font.file)),
      weight: font.weight,
      style: font.style,
    })),
  );
}

/** Everything the social preview needs from disk: its two pictures and its fonts. */
export async function getSocialPreviewAssets() {
  const [markSrc, dinosaurSrc, fonts] = await Promise.all([
    getPublicAssetDataUri('brand/mark-navy.png'),
    getPublicAssetDataUri('dinosaur-preview.png'),
    getSocialPreviewFonts(),
  ]);
  return { markSrc, dinosaurSrc, fonts };
}
