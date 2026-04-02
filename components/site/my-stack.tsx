'use client';

import {
  forwardRef,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties
} from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { stackItems, type StackItem } from './my-stack-data';

const canHoverQuery = '(hover: hover) and (pointer: fine)';

function StackDetails({ item }: { item: StackItem }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium italic tracking-[0.01em] text-muted-foreground">
        {item.label}
      </p>
      <p className="max-w-[30rem] text-sm leading-snug text-foreground/80">{item.description}</p>
    </div>
  );
}

interface StackTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  item: StackItem;
}

const StackTrigger = forwardRef<HTMLButtonElement, StackTriggerProps>(
  ({ item, className, style, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'vd-tech-stack-item vd-surface-card flex flex-col items-center gap-2 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--vd-interaction-blue)] focus-visible:ring-offset-4 focus-visible:ring-offset-background',
        className
      )}
      style={{ '--vd-tech-brand': item.brandColor, ...style } as CSSProperties}
      aria-label={`${item.name}. ${item.label}. ${item.description}`}
      {...props}
    >
      <div className="vd-tech-stack-shell vd-surface-card flex h-[80px] w-[80px] items-center justify-center border border-border/70 bg-muted text-muted-foreground">
        {item.icon}
      </div>
      <span className="vd-tech-stack-label text-xs font-medium text-muted-foreground">
        {item.name}
      </span>
    </button>
  )
);

StackTrigger.displayName = 'StackTrigger';

function StackItemCard({ item }: { item: StackItem }) {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(canHoverQuery);
    const updateCanHover = () => setCanHover(mediaQuery.matches);

    updateCanHover();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateCanHover);
      return () => mediaQuery.removeEventListener('change', updateCanHover);
    }

    mediaQuery.addListener(updateCanHover);
    return () => mediaQuery.removeListener(updateCanHover);
  }, []);

  if (canHover) {
    return (
      <li>
        <HoverCard openDelay={180} closeDelay={110}>
          <HoverCardTrigger asChild>
            <StackTrigger item={item} />
          </HoverCardTrigger>
          <HoverCardContent
            align="center"
            side="top"
            sideOffset={14}
            className="vd-surface-card w-[min(30rem,calc(100vw-2rem))] border-border/70 bg-background/98 p-4 shadow-xl"
          >
            <StackDetails item={item} />
          </HoverCardContent>
        </HoverCard>
      </li>
    );
  }

  return (
    <li>
      <Popover>
        <PopoverTrigger asChild>
          <StackTrigger item={item} />
        </PopoverTrigger>
        <PopoverContent
          align="center"
          side="top"
          sideOffset={12}
          className="vd-surface-card w-[min(30rem,calc(100vw-2rem))] border-border/70 bg-background/98 p-4 shadow-xl"
        >
          <StackDetails item={item} />
        </PopoverContent>
      </Popover>
    </li>
  );
}

export function MyStack() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="vd-section-heading mb-6 text-2xl font-semibold">My stack</h2>
        <p className="mb-6 max-w-2xl text-sm text-foreground/70">
          Hover or tap each tool to see what it helps with.
        </p>
        <ul className="flex flex-wrap justify-center gap-6 sm:gap-8 md:justify-between">
          {stackItems.map((item) => (
            <StackItemCard key={item.name} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
}
