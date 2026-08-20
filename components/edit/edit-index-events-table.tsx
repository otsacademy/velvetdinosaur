import Link from 'next/link'
import { Copy, Eye, MoreHorizontal, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/new-york-v4/ui/table'
import { cn } from '@/lib/utils'
import type { EventRow, EventSortKey, ViewMode } from '@/components/edit/pages-index-types'

type EventSortColumn = 'event' | 'status' | 'updated'

type EditIndexEventsTableProps = {
  events: EventRow[]
  eventSortKey: EventSortKey
  onSortColumnClick: (column: EventSortColumn) => void
  viewMode: ViewMode
  onDuplicate: (eventItem: EventRow) => void
  onDelete: (eventItem: EventRow) => void
}

function getStatus(eventItem: EventRow) {
  if (eventItem.status === 'published') {
    return {
      label: 'Live',
      className: 'border-transparent bg-[var(--vd-accent)] text-[var(--vd-accent-fg)]',
    }
  }

  return {
    label: 'Draft',
    className: 'bg-[var(--vd-muted)] text-[var(--vd-muted-fg)]',
  }
}

function formatWhen(value?: string | null) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

function eventHref(slug: string) {
  return `/events/${encodeURIComponent(slug)}`
}

export function EditIndexEventsTable({
  events,
  eventSortKey,
  onSortColumnClick,
  viewMode,
  onDuplicate,
  onDelete,
}: EditIndexEventsTableProps) {
  const activeSortColumn: EventSortColumn =
    eventSortKey === 'title-asc' ? 'event' : eventSortKey === 'status-asc' ? 'status' : 'updated'
  const activeSortDirection = eventSortKey === 'title-asc' || eventSortKey === 'status-asc' ? '↑' : '↓'

  const renderSortIndicator = (column: EventSortColumn) => {
    const isActive = column === activeSortColumn
    return (
      <span
        aria-hidden
        className={cn(
          'text-xs transition-colors',
          isActive ? 'text-[var(--vd-ring)]' : 'text-[var(--vd-muted-fg)]/75 group-hover:text-[var(--vd-ring)]',
        )}
      >
        {isActive ? activeSortDirection : '⇅'}
      </span>
    )
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((eventItem) => {
          const status = getStatus(eventItem)
          const liveHref = eventHref(eventItem.slug)
          const editHref = `/edit/events/new?slug=${encodeURIComponent(eventItem.slug)}`
          return (
            <Card key={eventItem.slug} className="space-y-3 border border-transparent bg-[var(--vd-card)] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="line-clamp-2 text-base font-semibold text-[var(--vd-fg)]">{eventItem.title}</p>
                  <p className="text-xs text-[var(--vd-muted-fg)]">
                    {eventItem.category}
                    {eventItem.primaryChapterName ? ` • ${eventItem.primaryChapterName}` : ''}
                    {' • '}
                    {eventItem.organizer || '—'}
                  </p>
                  <p className="truncate text-xs text-[var(--vd-muted-fg)]">/events/{eventItem.slug}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge className={cn(status.className)}>{status.label}</Badge>
                  {eventItem.featured ? (
                    <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-900">
                      Featured
                    </Badge>
                  ) : null}
                </div>
              </div>

              <p className="text-xs text-[var(--vd-muted-fg)]">Starts: {formatWhen(eventItem.startDateTime)}</p>
              <p className="text-xs text-[var(--vd-muted-fg)]">Last updated: {formatWhen(eventItem.updatedAt)}</p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button size="sm" variant="outline" asChild>
                  <Link href={liveHref} target="_blank" rel="noreferrer">
                    <Eye className="h-4 w-4" />
                    Preview
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={editHref}>Edit</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Event actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={editHref}>Edit event</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onDuplicate(eventItem)}>
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={liveHref} target="_blank" rel="noreferrer">
                        View live
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => onDelete(eventItem)} className="text-rose-600">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[var(--vd-radius)] bg-[var(--vd-card)] shadow-sm">
      <Table className="text-sm text-[var(--vd-fg)]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[55%] text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">
              <button
                type="button"
                onClick={() => onSortColumnClick('event')}
                className={cn(
                  'group inline-flex items-center gap-1.5 transition-colors hover:text-[var(--vd-fg)]',
                  activeSortColumn === 'event' ? 'text-[var(--vd-fg)]' : '',
                )}
                aria-label="Sort by event"
              >
                <span>Event</span>
                {renderSortIndicator('event')}
              </button>
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">
              <button
                type="button"
                onClick={() => onSortColumnClick('status')}
                className={cn(
                  'group inline-flex items-center gap-1.5 transition-colors hover:text-[var(--vd-fg)]',
                  activeSortColumn === 'status' ? 'text-[var(--vd-fg)]' : '',
                )}
                aria-label="Sort by status"
              >
                <span>Status</span>
                {renderSortIndicator('status')}
              </button>
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">
              <button
                type="button"
                onClick={() => onSortColumnClick('updated')}
                className={cn(
                  'group inline-flex items-center gap-1.5 transition-colors hover:text-[var(--vd-fg)]',
                  activeSortColumn === 'updated' ? 'text-[var(--vd-fg)]' : '',
                )}
                aria-label="Sort by last updated"
              >
                <span>Last updated</span>
                {renderSortIndicator('updated')}
              </button>
            </TableHead>
            <TableHead className="text-right text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((eventItem) => {
            const status = getStatus(eventItem)
            const liveHref = eventHref(eventItem.slug)
            const editHref = `/edit/events/new?slug=${encodeURIComponent(eventItem.slug)}`
            return (
              <TableRow
                key={eventItem.slug}
                className="group border-[var(--vd-border)]/35 transition-colors hover:bg-[var(--vd-ring)]/8"
              >
                <TableCell className="border-l-2 border-l-transparent py-4 align-top whitespace-normal group-hover:border-l-[var(--vd-ring)]/80">
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-[var(--vd-fg)]">{eventItem.title}</p>
                    <p className="text-xs text-[var(--vd-muted-fg)]">
                      <span className="font-medium text-[var(--vd-fg)]/80">Category:</span> {eventItem.category}
                      {eventItem.primaryChapterName ? (
                        <>
                          <span className="mx-1.5">•</span>
                          <span className="font-medium text-[var(--vd-fg)]/80">Chapter:</span> {eventItem.primaryChapterName}
                        </>
                      ) : null}
                      <span className="mx-1.5">•</span>
                      {eventItem.organizer || '—'}
                    </p>
                    <p className="text-xs text-[var(--vd-muted-fg)]">
                      <span className="font-medium text-[var(--vd-fg)]/80">Start:</span> {formatWhen(eventItem.startDateTime)}
                    </p>
                    <p className="text-xs text-[var(--vd-muted-fg)]">
                      <span className="font-medium text-[var(--vd-fg)]/80">URL:</span> /events/{eventItem.slug}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="py-4 align-top">
                  <div className="space-y-1.5">
                    <Badge className={cn(status.className)}>{status.label}</Badge>
                    {eventItem.featured ? (
                      <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-900">
                        Featured
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="py-4 align-top">
                  <p className="text-xs text-[var(--vd-muted-fg)]">{formatWhen(eventItem.updatedAt)}</p>
                </TableCell>
                <TableCell className="py-4 align-top">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={liveHref} target="_blank" rel="noreferrer">
                        <Eye className="h-4 w-4" />
                        Preview
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={editHref}>Edit</Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Event actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={editHref}>Edit event</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onDuplicate(eventItem)}>
                          <Copy className="h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={liveHref} target="_blank" rel="noreferrer">
                            View live
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => onDelete(eventItem)} className="text-rose-600">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
