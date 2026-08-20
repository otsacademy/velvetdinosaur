'use client';

import { CalendarDays, ChevronLeft, ChevronRight, Plus, Settings, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { type CalendarViewMode } from '@/components/edit/calendar-workspace.shared';

const VIEW_OPTIONS: Array<{ key: CalendarViewMode; label: string }> = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'agenda', label: 'Agenda' }
];

type CalendarToolbarProps = {
  dateLabel: string;
  view: CalendarViewMode;
  onChangeView: (view: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenEvents: () => void;
  onOpenSettings: () => void;
  showZoom: boolean;
  hourHeight: number;
  onChangeHourHeight: (nextHeight: number) => void;
  onOpenCreate: () => void;
};

export function CalendarToolbar({
  dateLabel,
  view,
  onChangeView,
  onPrev,
  onNext,
  onToday,
  onOpenEvents,
  onOpenSettings,
  showZoom,
  hourHeight,
  onChangeHourHeight,
  onOpenCreate
}: CalendarToolbarProps) {
  return (
    <div className="space-y-3 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)]/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrev} aria-label="Previous period">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNext} aria-label="Next period">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={onToday}>
            Today
          </Button>
          <p className="ml-1 text-sm font-semibold text-[var(--vd-fg)]">{dateLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/40 p-0.5">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => onChangeView(option.key)}
                className={cn(
                  'rounded-[calc(var(--vd-radius)-6px)] px-2.5 py-1 text-xs font-medium transition-colors',
                  view === option.key
                    ? 'bg-[var(--vd-bg)] text-[var(--vd-fg)] shadow-sm'
                    : 'text-[var(--vd-muted-fg)] hover:text-[var(--vd-fg)]'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button
            variant={view === 'events' ? 'secondary' : 'outline'}
            size="sm"
            className="h-8 gap-1.5"
            onClick={onOpenEvents}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Events
          </Button>
          {showZoom ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <ZoomIn className="h-3.5 w-3.5" />
                  Zoom
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="end">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--vd-muted-fg)]">Hour height</span>
                    <span className="text-xs font-medium text-[var(--vd-fg)]">{hourHeight}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ZoomOut className="h-3.5 w-3.5 text-[var(--vd-muted-fg)]" />
                    <Slider
                      value={[hourHeight]}
                      onValueChange={([value]) => {
                        if (typeof value === 'number') onChangeHourHeight(value);
                      }}
                      min={40}
                      max={120}
                      step={4}
                      className="flex-1"
                    />
                    <ZoomIn className="h-3.5 w-3.5 text-[var(--vd-muted-fg)]" />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : null}
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onOpenSettings}>
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Button>
          <Button size="sm" className="h-8 gap-1.5" onClick={onOpenCreate}>
            <Plus className="h-3.5 w-3.5" />
            New Event
          </Button>
        </div>
      </div>
    </div>
  );
}
