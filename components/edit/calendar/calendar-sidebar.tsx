'use client';

import { Share2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { type CalendarRecord } from '@/components/edit/calendar-workspace.shared';

function colorClass(token: string) {
  if (token === 'accent') return 'bg-[var(--vd-accent)]';
  if (token === 'destructive') return 'bg-[var(--destructive)]';
  if (token === 'muted') return 'bg-[var(--vd-muted-fg)]';
  return 'bg-[var(--vd-primary)]';
}

type CalendarSidebarProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  calendars: CalendarRecord[];
  onToggleCalendar: (id: string) => void;
  onAddCalendar: () => void;
  onShareCalendar: (calendar: CalendarRecord) => void;
  weekStartsOn?: 0 | 1;
};

export function CalendarSidebar({
  selectedDate,
  onSelectDate,
  calendars,
  onToggleCalendar,
  onAddCalendar,
  onShareCalendar,
  weekStartsOn = 1
}: CalendarSidebarProps) {
  const ownedCalendars = calendars.filter((calendar) => calendar.owned);
  const sharedCalendars = calendars.filter((calendar) => !calendar.owned);

  return (
    <div className="space-y-4">
      <Card className="p-0">
        <CardContent className="p-4">
          <Calendar
            mode="single"
            weekStartsOn={weekStartsOn}
            selected={selectedDate}
            onSelect={(date) => {
              if (date) onSelectDate(date);
            }}
            className="w-full"
          />
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Calendars</CardTitle>
        </CardHeader>
        <CardContent className="mt-0 space-y-2 p-4 pt-0">
          {ownedCalendars.map((calendar) => (
            <div
              key={calendar.id}
              className="flex items-center justify-between gap-2 rounded-[var(--vd-radius)] border border-[var(--vd-border)] px-3 py-2"
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                <Checkbox checked={calendar.visible} onCheckedChange={() => onToggleCalendar(calendar.id)} />
                <span className={`h-3.5 w-3.5 rounded-full ring-1 ring-black/10 ${colorClass(calendar.color)}`} aria-hidden="true" />
                <span className="truncate text-sm text-[var(--vd-fg)]">{calendar.label}</span>
              </label>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onShareCalendar(calendar)}>
                <Share2 className="h-3.5 w-3.5" />
                <span className="sr-only">Share {calendar.label}</span>
              </Button>
            </div>
          ))}
          <Button variant="outline" className="w-full" onClick={onAddCalendar}>
            Add calendar
          </Button>
        </CardContent>
      </Card>

      {sharedCalendars.length ? (
        <Card className="p-0">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Shared calendars</CardTitle>
          </CardHeader>
          <CardContent className="mt-0 space-y-2 p-4 pt-0">
            {sharedCalendars.map((calendar) => (
              <label
                key={calendar.id}
                className="flex cursor-pointer items-center justify-between rounded-[var(--vd-radius)] border border-[var(--vd-border)] px-3 py-2"
              >
                <span className="inline-flex min-w-0 items-center gap-2 text-sm text-[var(--vd-fg)]">
                  <span className={`h-3.5 w-3.5 rounded-full ring-1 ring-black/10 ${colorClass(calendar.color)}`} aria-hidden="true" />
                  <span className="truncate">{calendar.label}</span>
                </span>
                <Checkbox checked={calendar.visible} onCheckedChange={() => onToggleCalendar(calendar.id)} />
              </label>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
