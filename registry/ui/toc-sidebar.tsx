'use client';

import {
  type TocSideBarProps,
  useTocSideBar,
  useTocSideBarState,
} from '@platejs/toc/react';
import { cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

import { Button } from './button';
import { popoverVariants } from './popover';

const tocSidebarButtonVariants = cva(
  'block h-auto w-full rounded-sm p-0 text-left',
  {
    variants: {
      active: {
        false: 'text-muted-foreground hover:text-foreground',
        true: 'text-brand hover:text-brand',
      },
      depth: {
        1: 'pl-0',
        2: 'pl-3',
        3: 'pl-6',
      },
    },
  }
);

export function TocSidebar({
  className,
  maxShowCount = 20,
  ...props
}: TocSideBarProps & { className?: string; maxShowCount?: number }) {
  const state = useTocSideBarState({
    ...props,
  });
  const { activeContentId, headingList, open } = state;
  const { navProps, onContentClick } = useTocSideBar(state);

  return (
    <div className={cn('sticky top-0 right-0 z-5', className)}>
      <div className={cn('group absolute top-0 right-0 z-10 max-h-[400px]')}>
        <div className="relative z-10 mr-2.5 flex w-[28px] flex-col justify-center overflow-hidden pb-3 pr-2 transition-[width] duration-[200ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:w-[240px]">
          <div className={cn('flex flex-col gap-3 pb-3 pl-5')}>
            {headingList.slice(0, maxShowCount).map((item) => (
              <div key={item.id}>
                <div
                  className={cn(
                    'h-0.5 rounded-xs bg-[rgb(200,200,200)]',
                    activeContentId === item.id && 'bg-primary'
                  )}
                  style={{
                    marginLeft: `${4 * (item.depth - 1)}px`,
                    width: item.depth <= 1 ? '20px' : item.depth === 2 ? '14px' : '10px',
                  }}
                />
              </div>
            ))}
          </div>

          <nav
            aria-label="Table of contents"
            className={cn(
              '-top-2.5 absolute right-0 w-[240px] overflow-hidden whitespace-nowrap px-2.5',
              'pointer-events-none opacity-0 transition-[opacity] duration-[200ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
              'group-hover:pointer-events-auto group-hover:opacity-100',
              'touch:pointer-events-auto touch:opacity-100',
              headingList.length === 0 && 'hidden'
            )}
            {...navProps}
          >
            <div
              className={cn(
                popoverVariants(),
                '-mr-2.5 max-h-96 w-[240px] scroll-m-1 overflow-auto rounded-2xl p-3'
              )}
              id="toc_wrap"
            >
              <div className={cn('relative z-10 p-1.5', !open && 'hidden')}>
                {headingList.map((item, index) => {
                  const isActive = activeContentId
                    ? activeContentId === item.id
                    : index === 0;

                  return (
                    <Button
                      aria-current={isActive}
                      className={cn(
                        tocSidebarButtonVariants({
                          active: isActive,
                          depth: item.depth as any,
                        })
                      )}
                      id={isActive ? 'toc_item_active' : 'toc_item'}
                      key={index}
                      onClick={(e) => onContentClick(e, item, 'smooth')}
                      variant="ghost"
                    >
                      <div className="truncate p-1">{item.title}</div>
                    </Button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
