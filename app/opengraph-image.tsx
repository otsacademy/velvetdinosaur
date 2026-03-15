import { ImageResponse } from 'next/og';
import { SocialPreview } from '@/lib/social-preview';
import { socialPreviewAlt } from '@/lib/site-copy';
import { getPublicAssetDataUri } from '@/lib/social-preview-image';

export const runtime = 'nodejs';
export const alt = socialPreviewAlt;
export const size = {
  width: 1200,
  height: 630
};
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const dinosaurSrc = await getPublicAssetDataUri('dinosaur-preview.png');
  return new ImageResponse(<SocialPreview dinosaurSrc={dinosaurSrc} />, size);
}
