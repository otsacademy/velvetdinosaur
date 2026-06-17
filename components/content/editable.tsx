'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';

type EditableTextProps = {
  contentKey?: string;
  value?: string;
  as?: React.ElementType;
  multiline?: boolean;
  showIcon?: boolean;
  className?: string;
};

export function EditableText({
  value,
  as = 'span',
  multiline = false,
  className
}: EditableTextProps) {
  const Comp = as as any;
  const text = value ?? '';

  if (multiline) {
    return <Comp className={cn('whitespace-pre-wrap', className)}>{text}</Comp>;
  }

  return <Comp className={cn(className)}>{text}</Comp>;
}

type EditableImageProps = {
  contentKey?: string;
  src?: string | null;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
};

export function EditableImage({
  contentKey: _contentKey,
  className,
  alt,
  src,
  width,
  height,
  sizes,
  priority
}: EditableImageProps) {
  // Route through OptimizedImage so editable images get next/image optimization
  // (with automatic <img> fallback for inline/external srcs).
  const resolvedAlt = alt ?? '';

  if (typeof width === 'number' && typeof height === 'number') {
    return (
      <OptimizedImage
        src={src}
        alt={resolvedAlt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        className={cn(className)}
      />
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={resolvedAlt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn(className)}
    />
  );
}
