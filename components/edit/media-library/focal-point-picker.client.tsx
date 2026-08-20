/* eslint-disable @next/next/no-img-element -- media library renders arbitrary external URLs */
'use client';

import { useCallback, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { clamp01 } from '@/lib/media/focal-point';

const DEFAULT_FOCAL_STEP = 0.01;
const SHIFT_FOCAL_STEP = 0.05;

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function FocalPointPicker({
  imageUrl,
  focalX,
  focalY,
  onChange,
  onReset,
  disabled = false
}: {
  imageUrl: string;
  focalX?: number;
  focalY?: number;
  onChange: (next: { focalX: number; focalY: number }) => void;
  onReset: () => void;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeDragRef = useRef(false);

  const normalizedX = clamp01(focalX);
  const normalizedY = clamp01(focalY);
  const safeX = normalizedX ?? 0.5;
  const safeY = normalizedY ?? 0.5;

  const [dragging, setDragging] = useState(false);

  const projectPoint = useCallback(
    (clientX: number, clientY: number) => {
      const box = containerRef.current?.getBoundingClientRect();
      if (!box || box.width <= 0 || box.height <= 0) return null;
      const nextX = clamp01((clientX - box.left) / box.width);
      const nextY = clamp01((clientY - box.top) / box.height);
      if (nextX === undefined || nextY === undefined) return null;
      return { focalX: nextX, focalY: nextY };
    },
    []
  );

  const commitPointer = useCallback(
    (clientX: number, clientY: number) => {
      const next = projectPoint(clientX, clientY);
      if (!next) return;
      onChange(next);
    },
    [onChange, projectPoint]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activeDragRef.current = true;
    setDragging(true);
    commitPointer(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDragRef.current || disabled) return;
    event.preventDefault();
    commitPointer(event.clientX, event.clientY);
  };

  const stopDrag = () => {
    activeDragRef.current = false;
    setDragging(false);
  };

  const adjust = (deltaX: number, deltaY: number) => {
    if (disabled) return;
    const nextX = clamp01(safeX + deltaX);
    const nextY = clamp01(safeY + deltaY);
    if (nextX === undefined || nextY === undefined) return;
    onChange({ focalX: nextX, focalY: nextY });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? SHIFT_FOCAL_STEP : DEFAULT_FOCAL_STEP;
    switch (event.key) {
      case 'ArrowLeft':
        adjust(-step, 0);
        return;
      case 'ArrowRight':
        adjust(step, 0);
        return;
      case 'ArrowUp':
        adjust(0, -step);
        return;
      case 'ArrowDown':
        adjust(0, step);
        return;
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[var(--vd-fg)]">Focal point</p>
      <div
        ref={containerRef}
        tabIndex={disabled ? -1 : 0}
        role="application"
        aria-label="Focal point editor"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onPointerLeave={stopDrag}
        onBlur={() => {
          if (!dragging) stopDrag();
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative h-40 overflow-hidden rounded-lg border border-[var(--vd-border)] bg-[var(--vd-muted)]/20',
          'cursor-crosshair focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vd-ring)]',
          disabled ? 'cursor-not-allowed opacity-70' : 'cursor-crosshair'
        )}
      >
        <img src={imageUrl} alt="Asset focal preview" className="h-full w-full object-cover" loading="lazy" />
        <span
          className="pointer-events-none absolute -ml-2.5 -mt-2.5 h-5 w-5 rounded-full border-2 border-white bg-[var(--vd-fg)] shadow"
          style={{ left: formatPercent(safeX), top: formatPercent(safeY), transform: 'translate(-50%, -50%)' }}
          aria-hidden="true"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" type="button" variant="outline" onClick={onReset} disabled={disabled}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to center
        </Button>
        <p className="text-xs text-[var(--vd-muted-fg)]">Use arrows to nudge; Shift = larger step.</p>
      </div>
      <p className="text-xs text-[var(--vd-muted-fg)]">
        Current position: {Math.round(safeX * 100)}% × {Math.round(safeY * 100)}%
      </p>
    </div>
  );
}
