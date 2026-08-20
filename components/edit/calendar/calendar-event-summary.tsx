'use client';

import { format } from 'date-fns';
import { CalendarClock, FileText, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { colorClass } from '@/components/edit/calendar/calendar-workspace.helpers';
import { parseDateKey, toMinutes, type CalendarEvent } from '@/components/edit/calendar-workspace.shared';

type CalendarEventSummaryProps = {
  event: CalendarEvent;
  calendarLabel: string;
  calendarColor: string;
  editable: boolean;
  pendingAction: string;
  onEdit: () => void;
  onDelete: () => void;
};

function toFriendlyTime(clock: string) {
  const totalMinutes = toMinutes(clock);
  if (totalMinutes == null) return clock;
  const hour24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hour12 = hour24 % 12 || 12;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function toEventTypeLabel(value: CalendarEvent['eventType']) {
  if (value === 'out-of-office') return 'Out of Office';
  return value[0].toUpperCase() + value.slice(1);
}

export function CalendarEventSummary({
  event,
  calendarLabel,
  calendarColor,
  editable,
  pendingAction,
  onEdit,
  onDelete
}: CalendarEventSummaryProps) {
  const dateLabel = format(parseDateKey(event.dateKey), 'EEEE, MMMM d');
  const timeLabel = event.allDay ? 'All day' : `${toFriendlyTime(event.time)} · ${event.durationMin}m`;

  return (
    <aside className="h-fit rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)]/55 p-4">
      <div className="space-y-1">
        <p className="text-lg font-semibold text-[var(--vd-fg)]">{event.title}</p>
        <p className="flex items-center gap-1.5 text-sm text-[var(--vd-muted-fg)]">
          <CalendarClock className="h-4 w-4" />
          {dateLabel} · {timeLabel}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge className="border-[var(--vd-border)] bg-[var(--vd-muted)] text-[var(--vd-fg)]">
          {toEventTypeLabel(event.eventType)}
        </Badge>
        <Badge className="border-[var(--vd-border)] bg-[var(--vd-muted)] text-[var(--vd-fg)]">
          <span className={`mr-1.5 inline-block h-2.5 w-2.5 rounded-full ${colorClass(calendarColor)}`} />
          {calendarLabel}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="space-y-1.5">
          <Label className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Location
          </Label>
          <Input value={event.location || ''} readOnly placeholder="No location" />
        </div>
        <div className="space-y-1.5">
          <Label className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Guests
          </Label>
          <Input value={event.attendees.join(', ')} readOnly placeholder="No guests" />
        </div>
        <div className="space-y-1.5">
          <Label className="inline-flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Description
          </Label>
          <Textarea value={event.notes || ''} readOnly className="min-h-[110px]" placeholder="No additional notes" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={onEdit} disabled={!editable || pendingAction !== ''}>
          Edit event
        </Button>
        <Button variant="outline" onClick={onDelete} disabled={!editable || pendingAction !== ''}>
          {pendingAction === 'delete' ? 'Deleting…' : 'Delete'}
        </Button>
      </div>

      {!editable ? (
        <p className="mt-3 text-xs text-[var(--vd-muted-fg)]">
          This event is read-only in your current calendar access level.
        </p>
      ) : null}
    </aside>
  );
}
