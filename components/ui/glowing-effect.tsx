'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type GlowingEffectProps = React.HTMLAttributes<HTMLDivElement> & {
  glow?: boolean;
  disabled?: boolean;
  proximity?: number;
  spread?: number;
  inactiveZone?: number;
};

function setVar(el: HTMLElement, name: string, value: string) {
  el.style.setProperty(name, value);
}

export function GlowingEffect({
  className,
  glow = true,
  disabled = false,
  proximity = 64,
  spread = 40,
  inactiveZone = 0.01,
  style,
  ...props
}: GlowingEffectProps) {
  const selfRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (disabled) return;
    const parent = selfRef.current?.parentElement;
    if (!parent) return;

    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setVar(parent, '--vd-ge-x', `${x}px`);
      setVar(parent, '--vd-ge-y', `${y}px`);

      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const max = Math.sqrt(cx * cx + cy * cy) + 0.0001;

      // Opacity peaks near the cursor; fades out towards edges.
      const proximityBoost = Math.min(1, proximity / 256);
      const base = 1 - dist / max;
      const op = Math.max(0, base * (0.6 + proximityBoost * 0.4) - inactiveZone);
      setVar(parent, '--vd-ge-op', op.toFixed(3));
    };

    const onLeave = () => setVar(parent, '--vd-ge-op', '0');

    parent.addEventListener('mousemove', onMove);
    parent.addEventListener('mouseleave', onLeave);

    // Default values for static render (no hover yet).
    setVar(parent, '--vd-ge-op', '0');

    return () => {
      parent.removeEventListener('mousemove', onMove);
      parent.removeEventListener('mouseleave', onLeave);
    };
  }, [disabled, inactiveZone, proximity]);

  const sizePx = Math.max(160, spread * 10);

  return (
    <div
      ref={selfRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 rounded-[inherit]', className)}
      style={{
        ...style,
        ['--vd-ge-size' as never]: `${sizePx}px`,
      }}
      {...props}
    >
      <div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          background:
            'radial-gradient(circle var(--vd-ge-size) at var(--vd-ge-x, 50%) var(--vd-ge-y, 50%), color-mix(in oklab, var(--vd-accent, #7c3aed) 35%, transparent), transparent 60%)',
          opacity: 'var(--vd-ge-op, 0)',
          transition: 'opacity 200ms ease',
        }}
      />
      {glow ? (
        <div
          className="absolute inset-0 rounded-[inherit]"
          style={{
            boxShadow:
              '0 0 0 1px color-mix(in oklab, var(--vd-accent, #7c3aed) 30%, transparent), 0 12px 40px color-mix(in oklab, var(--vd-accent, #7c3aed) 18%, transparent)',
            opacity: 'var(--vd-ge-op, 0)',
            transition: 'opacity 200ms ease',
          }}
        />
      ) : null}
    </div>
  );
}

