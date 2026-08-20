'use client';

import Link from 'next/link';
import { ArrowUpRight, CalendarDays, RadioTower } from 'lucide-react';
import { registrationModeLabel } from '@/components/edit/event-editor.shared';
import { formatDate, type EventWorkspaceItem } from '@/components/edit/event-registration/event-registration-workspace.shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type EventRegistrationEventFilterCardProps = {
  events: EventWorkspaceItem[];
  selectedEventId: string;
  selectedEvent: EventWorkspaceItem | null;
  onSelectEvent: (value: string) => void;
};

function humanizeStatus(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function EventRegistrationEventFilterCard({
  events,
  selectedEventId,
  selectedEvent,
  onSelectEvent
}: EventRegistrationEventFilterCardProps) {
  return (
    <Card className="border-l-4 border-l-[var(--vd-primary)]">
      <CardHeader>
        <CardTitle>Event Context</CardTitle>
        <CardDescription>
          Choose any event that has not yet finished. Campaigns, registrants, and deliveries all follow this selection.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,360px)] xl:items-end">
        <div className="space-y-2">
          <Label>Selected event</Label>
          <Select
            value={selectedEventId || '__none__'}
            onValueChange={(value) => onSelectEvent(value === '__none__' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose an upcoming or active event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No event selected</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title} ({event.confirmedCount} confirmed)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-[var(--vd-border)] bg-[var(--vd-muted)]/20 p-4">
          {selectedEvent ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--vd-fg)]">{selectedEvent.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <RadioTower className="h-3 w-3" />
                      {registrationModeLabel(
                        (selectedEvent.registrationMode === 'local' ||
                        selectedEvent.registrationMode === 'external'
                          ? selectedEvent.registrationMode
                          : 'none')
                      )}
                    </Badge>
                    <Badge variant="outline">{humanizeStatus(selectedEvent.status)}</Badge>
                  </div>
                </div>
                <Link
                  href={`/events/${selectedEvent.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--vd-link)] hover:underline"
                >
                  View public event
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[var(--vd-border)] bg-[var(--vd-card)] p-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--vd-muted-fg)]">Event date</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-[var(--vd-fg)]">
                    <CalendarDays className="h-4 w-4 text-[var(--vd-muted-fg)]" />
                    {formatDate(selectedEvent.startDateTime)}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--vd-border)] bg-[var(--vd-card)] p-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--vd-muted-fg)]">Registration totals</p>
                  <p className="mt-1 text-sm text-[var(--vd-fg)]">
                    Confirmed {selectedEvent.confirmedCount} • Pending {selectedEvent.pendingCount} • Cancelled {selectedEvent.cancelledCount}
                  </p>
                </div>
              </div>

              {selectedEvent.registrationMode !== 'local' ? (
                <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  This event is not using local registration. Outreach remains available, but confirmed participant counts
                  will stay empty unless registrations exist.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2 text-sm text-[var(--vd-muted-fg)]">
              <p className="font-medium text-[var(--vd-fg)]">No event selected</p>
              <p>Pick an event above to load its registrants, campaign history, and delivery log.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
