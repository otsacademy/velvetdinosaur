'use client';

import * as React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type DemoHelpTooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: React.ComponentProps<typeof TooltipContent>['side'];
  align?: React.ComponentProps<typeof TooltipContent>['align'];
  contentClassName?: string;
  triggerClassName?: string;
};

export function DemoHelpTooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  contentClassName,
  triggerClassName
}: DemoHelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex', triggerClassName)}>{children}</span>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        className={cn('max-w-72 text-pretty text-[12px] leading-5', contentClassName)}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
