import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { OptimizedImage } from '@/components/ui/optimized-image';

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
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-[var(--vd-muted)]">
          <OptimizedImage
            src={src}
            alt={alt}
            fill
            className="h-full w-full object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
            priority={loading === 'eager' || fetchPriority === 'high'}
            imageOptions={{ width: 1200, height: 800, fit: 'cover' }}
          />
        </div>
      </CardContent>
      {caption ? (
        <CardFooter className="text-sm text-[var(--vd-muted-fg)]">{caption}</CardFooter>
      ) : null}
    </Card>
  );
}
