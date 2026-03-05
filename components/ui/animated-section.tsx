'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type AnimatedSectionProps = React.HTMLAttributes<HTMLDivElement> & {
  animation?: 'fade-up';
  staggerChildren?: boolean;
  staggerDelay?: number;
  once?: boolean;
};

function useInView<T extends HTMLElement>(once: boolean) {
  const ref = React.useRef<T | null>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (inView && once) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) obs.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold: 0.12, rootMargin: '64px 0px' },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [inView, once]);

  return { ref, inView } as const;
}

export function AnimatedSection({
  className,
  animation = 'fade-up',
  staggerChildren = false,
  staggerDelay = 80,
  once = true,
  children,
  ...props
}: AnimatedSectionProps) {
  const { ref, inView } = useInView<HTMLDivElement>(once);

  const baseStyle: React.CSSProperties =
    animation === 'fade-up'
      ? {
          opacity: inView ? 1 : 0,
          transform: inView ? 'translate3d(0, 0, 0)' : 'translate3d(0, 12px, 0)',
          transition: 'opacity 420ms ease, transform 520ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          willChange: 'opacity, transform',
        }
      : {};

  const content = staggerChildren
    ? React.Children.map(children, (child, idx) => (
        <div
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translate3d(0, 0, 0)' : 'translate3d(0, 10px, 0)',
            transitionProperty: 'opacity, transform',
            transitionDuration: '420ms, 520ms',
            transitionTimingFunction: 'ease, cubic-bezier(0.2, 0.8, 0.2, 1)',
            transitionDelay: `${Math.max(0, idx) * Math.max(0, staggerDelay)}ms`,
            willChange: 'opacity, transform',
          }}
        >
          {child}
        </div>
      ))
    : children;

  return (
    <div ref={ref} className={cn(className)} style={staggerChildren ? undefined : baseStyle} {...props}>
      {content}
    </div>
  );
}

