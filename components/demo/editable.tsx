'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type EditableTextProps = {
  demoKey?: string;
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

type EditableImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  demoKey?: string;
};

export function EditableImage({ className, alt, ...props }: EditableImageProps) {
  // Keep as <img> so this can be used in arbitrary client blocks without Next/Image config.
  return <img className={cn(className)} alt={alt ?? ''} {...props} />;
}
