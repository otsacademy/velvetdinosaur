'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  EditableImage,
  useImageEditSettings
} from '@/components/puck/blocks/editable-image.client';

export type ImageBlockProps = {
  src?: string;
  alt?: string;
  caption?: string;
};

export function ImageBlock({
  src = '/images/placeholder.svg',
  alt = 'Placeholder image',
  caption = 'Drop in R2-hosted assets or external images.'
}: ImageBlockProps) {
  const settings = useImageEditSettings('src');
  const width = typeof settings.width === 'number' ? Math.min(100, Math.max(20, settings.width)) : 100;
  const align = settings.align || 'center';
  const cardStyle = settings.width
    ? {
        width: `${width}%`,
        marginLeft: align === 'right' || align === 'center' ? 'auto' : 0,
        marginRight: align === 'left' || align === 'center' ? 'auto' : 0
      }
    : undefined;
  const ratio = settings.aspectRatio && settings.aspectRatio !== 'original'
    ? settings.aspectRatio.replace('/', ' / ')
    : '3 / 2';

  return (
    <Card className="overflow-hidden" style={cardStyle}>
      <CardContent className="p-0">
        <div className="relative w-full overflow-hidden bg-[var(--vd-muted)]" style={{ aspectRatio: ratio }}>
          <EditableImage
            src={src}
            alt={alt}
            sourcePath="src"
            applyLayout={false}
            className="h-full w-full object-cover"
            optimized={{
              fill: true,
              sizes: '(max-width: 768px) 100vw, 1200px',
              imageOptions: { width: 1200, height: 800, fit: 'cover' }
            }}
          />
        </div>
      </CardContent>
      {caption ? (
        <CardFooter className="text-sm text-[var(--vd-muted-fg)]">{caption}</CardFooter>
      ) : null}
    </Card>
  );
}
