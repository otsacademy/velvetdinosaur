'use client';

import * as React from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton
} from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';

type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: ButtonProps['variant'];
};

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();
  const navButtonClassName = cn(
    'inline-flex h-8 w-8 items-center justify-center rounded-[var(--vd-radius)] border border-transparent text-[var(--vd-fg)] transition-colors',
    buttonVariant === 'outline' && 'border-[var(--vd-border)] hover:bg-[var(--vd-muted)]',
    buttonVariant === 'default' && 'bg-[var(--vd-primary)] text-[var(--vd-primary-fg)] hover:opacity-90',
    buttonVariant === 'ghost' && 'hover:bg-[var(--vd-muted)]'
  );

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'group/calendar rounded-[var(--vd-radius)] bg-[var(--vd-popover)] p-3 text-[var(--vd-popover-fg)]',
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString('default', { month: 'short' }),
        ...formatters
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('relative flex flex-col gap-4 md:flex-row', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        nav: cn('absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1', defaultClassNames.nav),
        button_previous: cn(navButtonClassName, defaultClassNames.button_previous),
        button_next: cn(navButtonClassName, defaultClassNames.button_next),
        month_caption: cn(
          'flex h-8 w-full items-center justify-center px-8 text-sm font-semibold',
          defaultClassNames.month_caption
        ),
        dropdowns: cn('flex h-8 items-center justify-center gap-1.5 text-sm font-medium', defaultClassNames.dropdowns),
        dropdown_root: cn(
          'relative rounded-md border border-[var(--vd-border)] bg-[var(--vd-card)] shadow-sm',
          defaultClassNames.dropdown_root
        ),
        dropdown: cn('absolute inset-0 opacity-0', defaultClassNames.dropdown),
        caption_label: cn(
          'select-none font-medium',
          captionLayout === 'label'
            ? 'text-sm'
            : 'flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm',
          defaultClassNames.caption_label
        ),
        table: 'w-full border-collapse',
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'flex-1 rounded-md text-[0.8rem] font-semibold uppercase tracking-wide text-[var(--vd-muted-fg)]',
          defaultClassNames.weekday
        ),
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        day: cn(
          'relative aspect-square w-full p-0 text-center [&:last-child[data-selected=true]_button]:rounded-r-md',
          props.showWeekNumber
            ? '[&:nth-child(2)[data-selected=true]_button]:rounded-l-md'
            : '[&:first-child[data-selected=true]_button]:rounded-l-md',
          defaultClassNames.day
        ),
        range_start: cn('rounded-l-md bg-[var(--vd-muted)]', defaultClassNames.range_start),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn('rounded-r-md bg-[var(--vd-muted)]', defaultClassNames.range_end),
        today: cn(
          'rounded-md bg-[var(--vd-muted)] text-[var(--vd-fg)] data-[selected=true]:rounded-none',
          defaultClassNames.today
        ),
        outside: cn('text-[var(--vd-muted-fg)] aria-selected:text-[var(--vd-muted-fg)]', defaultClassNames.outside),
        disabled: cn('text-[var(--vd-muted-fg)] opacity-50', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames
      }}
      components={{
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => (
          <div data-slot="calendar" ref={rootRef} className={cn(rootClassName)} {...rootProps} />
        ),
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          if (orientation === 'left') {
            return <ChevronLeft className={cn('h-4 w-4', chevronClassName)} {...chevronProps} />;
          }
          if (orientation === 'right') {
            return <ChevronRight className={cn('h-4 w-4', chevronClassName)} {...chevronProps} />;
          }
          return <ChevronDown className={cn('h-4 w-4', chevronClassName)} {...chevronProps} />;
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...weekProps }) => (
          <td {...weekProps}>
            <div className="flex h-8 w-8 items-center justify-center text-center text-[0.8rem] text-[var(--vd-muted-fg)]">
              {children}
            </div>
          </td>
        ),
        ...components
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'h-8 w-8 rounded-md p-0 text-[0.85rem] font-medium',
        'data-[selected-single=true]:bg-[var(--vd-primary)] data-[selected-single=true]:text-[var(--vd-primary-fg)]',
        'data-[range-middle=true]:bg-[var(--vd-muted)] data-[range-middle=true]:text-[var(--vd-fg)]',
        'data-[range-start=true]:bg-[var(--vd-primary)] data-[range-start=true]:text-[var(--vd-primary-fg)]',
        'data-[range-end=true]:bg-[var(--vd-primary)] data-[range-end=true]:text-[var(--vd-primary-fg)]',
        'hover:bg-[var(--vd-muted)]',
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}
