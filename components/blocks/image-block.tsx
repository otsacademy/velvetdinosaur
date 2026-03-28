/* eslint-disable @next/next/no-img-element */
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { resolveAssetImageUrl } from '@/lib/uploads';

export type ImageBlockProps = {
  src?: string;
  alt?: string;
  caption?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
};

export function ImageBlock({
  src = '/assets/hero-panel.svg',
  alt = 'Neutral placeholder visual',
  caption = 'Replace this with your own photography, product imagery, or campaign artwork.',
  loading = 'lazy',
  fetchPriority
}: ImageBlockProps) {
  const resolvedSrc = resolveAssetImageUrl(src, { width: 1200, height: 800, fit: 'cover' });

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="aspect-[3/2] w-full overflow-hidden bg-[var(--vd-muted)]">
          <img
            src={resolvedSrc}
            alt={alt}
            className="h-full w-full object-cover"
            width={1200}
            height={800}
            loading={loading}
            fetchPriority={fetchPriority}
            decoding="async"
          />
        </div>
      </CardContent>
      {caption ? (
        <CardFooter className="text-sm text-[var(--vd-muted-fg)]">{caption}</CardFooter>
      ) : null}
    </Card>
  );
}
