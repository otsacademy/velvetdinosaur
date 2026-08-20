'use client';

import { CalendarDays, Loader2, Newspaper, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export type NewsletterContentOptionItem = {
  slug: string;
  title: string;
  dateLabel: string;
};

type HighlightDirectiveType = 'newsHighlights' | 'eventHighlights';

type NewsletterHighlightPickerProps = {
  canEditSelected: boolean;
  contentOptionsLoading: boolean;
  contentOptionsError: string;
  newsOptions: NewsletterContentOptionItem[];
  eventOptions: NewsletterContentOptionItem[];
  selectedNewsSlugs: string[];
  selectedEventSlugs: string[];
  onToggleNewsSlug: (slug: string) => void;
  onToggleEventSlug: (slug: string) => void;
  onClearSelections: () => void;
  onInsertDirective: (type: HighlightDirectiveType, slugs: string[]) => void;
  onInsertLatestNews: () => void;
  onInsertLatestEvents: () => void;
};

function selectionLabel(selectedSlugs: string[], noun: string) {
  return !selectedSlugs.length ? `Select ${noun}` : selectedSlugs.length === 1 ? `1 ${noun} selected` : `${selectedSlugs.length} ${noun}s selected`;
}

export function NewsletterHighlightPicker({
  canEditSelected,
  contentOptionsLoading,
  contentOptionsError,
  newsOptions,
  eventOptions,
  selectedNewsSlugs,
  selectedEventSlugs,
  onToggleNewsSlug,
  onToggleEventSlug,
  onClearSelections,
  onInsertDirective,
  onInsertLatestNews,
  onInsertLatestEvents
}: NewsletterHighlightPickerProps) {
  return (
    <div className="space-y-3 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">Content Highlights</p>
        {contentOptionsLoading ? (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--vd-muted-fg)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading content
          </span>
        ) : null}
      </div>
      <p className="text-xs text-[var(--vd-muted-fg)]">
        Pick exact published items, then insert a targeted token where your cursor is.
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2 rounded-[calc(var(--vd-radius)-2px)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-2.5">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium">
            <Newspaper className="h-3.5 w-3.5" />
            News Highlights
          </p>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="max-w-full justify-start truncate"
                  disabled={!canEditSelected || contentOptionsLoading || !newsOptions.length}
                >
                  {selectionLabel(selectedNewsSlugs, 'news article')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-[300px] w-[360px] overflow-auto">
                <DropdownMenuLabel>Published News</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {newsOptions.map((item) => (
                  <DropdownMenuCheckboxItem
                    key={item.slug}
                    checked={selectedNewsSlugs.includes(item.slug)}
                    onCheckedChange={() => onToggleNewsSlug(item.slug)}
                  >
                    <span className="truncate">{item.title}</span>
                    <span className="ml-1 text-xs text-[var(--vd-muted-fg)]">{item.dateLabel}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" variant="outline" size="sm" onClick={onInsertLatestNews} disabled={!canEditSelected}>
              Insert latest
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => onInsertDirective('newsHighlights', selectedNewsSlugs)}
              disabled={!canEditSelected || !selectedNewsSlugs.length}
            >
              Insert selected
            </Button>
          </div>
        </div>

        <div className="space-y-2 rounded-[calc(var(--vd-radius)-2px)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-2.5">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium">
            <CalendarDays className="h-3.5 w-3.5" />
            Event Highlights
          </p>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="max-w-full justify-start truncate"
                  disabled={!canEditSelected || contentOptionsLoading || !eventOptions.length}
                >
                  {selectionLabel(selectedEventSlugs, 'event')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-[300px] w-[360px] overflow-auto">
                <DropdownMenuLabel>Upcoming Events</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {eventOptions.map((item) => (
                  <DropdownMenuCheckboxItem
                    key={item.slug}
                    checked={selectedEventSlugs.includes(item.slug)}
                    onCheckedChange={() => onToggleEventSlug(item.slug)}
                  >
                    <span className="truncate">{item.title}</span>
                    <span className="ml-1 text-xs text-[var(--vd-muted-fg)]">{item.dateLabel}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" variant="outline" size="sm" onClick={onInsertLatestEvents} disabled={!canEditSelected}>
              Insert latest
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => onInsertDirective('eventHighlights', selectedEventSlugs)}
              disabled={!canEditSelected || !selectedEventSlugs.length}
            >
              Insert selected
            </Button>
          </div>
        </div>
      </div>

      {selectedNewsSlugs.length || selectedEventSlugs.length ? (
        <div className="space-y-2 rounded-[calc(var(--vd-radius)-2px)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-[var(--vd-muted-fg)]">Current targeted selection</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearSelections}
              disabled={!canEditSelected}
              className="h-7 px-2 text-xs"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedNewsSlugs.map((slug) => (
              <Badge key={`news-${slug}`} variant="secondary" className="font-mono text-[11px]">
                news:{slug}
              </Badge>
            ))}
            {selectedEventSlugs.map((slug) => (
              <Badge key={`event-${slug}`} variant="secondary" className="font-mono text-[11px]">
                event:{slug}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {contentOptionsError ? <p className="text-xs text-destructive">{contentOptionsError}</p> : null}
    </div>
  );
}
