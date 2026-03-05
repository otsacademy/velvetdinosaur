'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AnimatedSection } from '@/components/ui/animated-section';

export type SectionProps = React.HTMLAttributes<HTMLElement> & {
  animate?: boolean;
  divider?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
};

export function Section({
  className,
  animate = false,
  divider = false,
  size = 'md',
  maxWidth,
  children,
  ...props
}: SectionProps) {
  const padClass =
    size === 'hero'
      ? 'py-20 md:py-28'
      : size === 'lg'
        ? 'py-16 md:py-24'
        : size === 'sm'
          ? 'py-10 md:py-14'
          : 'py-14 md:py-20';

  const maxWidthClass =
    maxWidth === '7xl'
      ? 'max-w-7xl'
      : maxWidth === '6xl'
        ? 'max-w-6xl'
        : maxWidth === '5xl'
          ? 'max-w-5xl'
          : maxWidth === '4xl'
            ? 'max-w-4xl'
            : maxWidth === '3xl'
              ? 'max-w-3xl'
              : maxWidth === '2xl'
                ? 'max-w-2xl'
                : maxWidth === 'xl'
                  ? 'max-w-xl'
                  : maxWidth === 'lg'
                    ? 'max-w-lg'
                    : maxWidth === 'md'
                      ? 'max-w-md'
                      : maxWidth === 'sm'
                        ? 'max-w-sm'
                        : '';

  const content = (
    <div className={cn(maxWidthClass ? `mx-auto w-full ${maxWidthClass}` : 'container mx-auto', 'px-4 md:px-6')}>
      {children}
    </div>
  );

  return (
    <section
      className={cn(
        'relative w-full',
        padClass,
        divider ? 'border-b border-[var(--vd-border)]' : '',
        className,
      )}
      {...props}
    >
      {animate ? <AnimatedSection animation="fade-up">{content}</AnimatedSection> : content}
    </section>
  );
}

export type SectionHeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  displayFont?: boolean;
};

export function SectionHeading({
  className,
  displayFont = false,
  ...props
}: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        'mx-auto mb-6 max-w-3xl text-center text-3xl font-semibold leading-tight tracking-tight text-[var(--vd-fg)] md:mb-8 md:text-4xl',
        displayFont ? 'font-semibold' : '',
        className,
      )}
      {...props}
    />
  );
}
