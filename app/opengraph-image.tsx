import { ImageResponse } from 'next/og';
import { SocialPreview } from '@/lib/social-preview';
import { socialPreviewAlt } from '@/lib/site-copy';
import { getSocialPreviewAssets } from '@/lib/social-preview-image';

export const runtime = 'nodejs';
export const alt = socialPreviewAlt;
export const size = {
  width: 1200,
  height: 630
};
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const { markSrc, dinosaurSrc, fonts } = await getSocialPreviewAssets();
  return new ImageResponse(<SocialPreview markSrc={markSrc} dinosaurSrc={dinosaurSrc} />, {
    ...size,
    fonts
  });
}
