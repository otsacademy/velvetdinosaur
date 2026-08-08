'use client';

import type { ReactElement } from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Info icon rendered in a Puck field's labelIcon slot. Portalled Radix tooltip:
 * cannot be clipped by the properties sheet, flips to stay on screen, and wraps
 * between words only.
 */
export function fieldHelpIcon(help: string): ReactElement {
  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          role="button"
          aria-label={help}
          className="inline-flex rounded-sm p-0.5 text-[var(--vd-muted-fg)] focus-visible:outline-2 focus-visible:outline-[var(--vd-primary)]"
        >
          <Info className="h-3.5 w-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        collisionPadding={12}
        className="z-[60] max-w-[16rem] whitespace-normal text-sm leading-snug"
        style={{ overflowWrap: 'break-word', hyphens: 'none' }}
      >
        {help}
      </TooltipContent>
    </Tooltip>
  );
}
