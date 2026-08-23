'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  WEEKDAY_NAMES,
  type AvailabilityException,
  type BookingSettingsItem,
  type WeeklyHoursEntry
} from '@/components/edit/booking-api-shared';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const; // Monday first

function rangeForDay(weeklyHours: WeeklyHoursEntry[], day: number) {
  return weeklyHours.find((entry) => entry.day === day)?.ranges[0] ?? null;
}

export function BookingApiAvailabilityTab({
  settings,
  saving,
  onSave
}: {
  settings: BookingSettingsItem | null;
  saving: boolean;
  onSave: (patch: Partial<BookingSettingsItem>) => Promise<boolean>;
}) {
  const [exceptionDate, setExceptionDate] = useState('');
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [exceptionStart, setExceptionStart] = useState('09:00');
  const [exceptionEnd, setExceptionEnd] = useState('17:00');

  if (!settings) {
    return <p className="text-sm text-muted-foreground">Loading availability…</p>;
  }

  function setDayHours(day: number, open: boolean, start?: string, end?: string) {
    if (!settings) return;
    const existing = rangeForDay(settings.weeklyHours, day);
    const nextRange = open
      ? { start: start ?? existing?.start ?? '09:00', end: end ?? existing?.end ?? '17:00' }
      : null;
    const others = settings.weeklyHours.filter((entry) => entry.day !== day);
    const weeklyHours = nextRange ? [...others, { day, ranges: [nextRange] }] : others;
    void onSave({ weeklyHours });
  }

  function addException() {
    if (!settings || !exceptionDate) return;
    const next: AvailabilityException = {
      date: exceptionDate,
      available: exceptionOpen,
      ranges: exceptionOpen ? [{ start: exceptionStart, end: exceptionEnd }] : []
    };
    const exceptions = [...settings.exceptions.filter((entry) => entry.date !== exceptionDate), next].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    void onSave({ exceptions }).then((ok) => {
      if (ok) {
        setExceptionDate('');
        setExceptionOpen(false);
      }
    });
  }

  function removeException(date: string) {
    if (!settings) return;
    void onSave({ exceptions: settings.exceptions.filter((entry) => entry.date !== date) });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Venue opening hours</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            These hours apply to every bookable service, and to any staff member without their own hours.
          </p>
          {DAY_ORDER.map((day) => {
            const range = rangeForDay(settings.weeklyHours, day);
            const open = range !== null;
            return (
              <div key={day} className="flex items-center gap-3">
                <label className="flex w-28 items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={open}
                    disabled={saving}
                    onCheckedChange={(checked) => setDayHours(day, checked === true)}
                  />
                  {WEEKDAY_NAMES[day]}
                </label>
                {open ? (
                  <span className="flex items-center gap-2">
                    <Input
                      type="time"
                      className="w-[110px]"
                      value={range.start}
                      disabled={saving}
                      onChange={(event) => setDayHours(day, true, event.target.value, range.end)}
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="time"
                      className="w-[110px]"
                      value={range.end}
                      disabled={saving}
                      onChange={(event) => setDayHours(day, true, range.start, event.target.value)}
                    />
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Closed</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exceptions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Close specific dates (holidays) or open with special hours.
          </p>
          {settings.exceptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exceptions set.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {settings.exceptions.map((exception) => (
                <div
                  key={exception.date}
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{exception.date}</span>
                    <Badge variant={exception.available ? 'default' : 'secondary'}>
                      {exception.available
                        ? `Open ${exception.ranges[0]?.start ?? ''}–${exception.ranges[0]?.end ?? ''}`
                        : 'Closed'}
                    </Badge>
                  </span>
                  <Button size="sm" variant="outline" disabled={saving} onClick={() => removeException(exception.date)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <Label htmlFor="exception-date">Add exception</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="exception-date"
                type="date"
                className="w-[160px]"
                value={exceptionDate}
                onChange={(event) => setExceptionDate(event.target.value)}
              />
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={exceptionOpen}
                  onCheckedChange={(checked) => setExceptionOpen(checked === true)}
                />
                Open with special hours
              </label>
            </div>
            {exceptionOpen ? (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  className="w-[110px]"
                  value={exceptionStart}
                  onChange={(event) => setExceptionStart(event.target.value)}
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="time"
                  className="w-[110px]"
                  value={exceptionEnd}
                  onChange={(event) => setExceptionEnd(event.target.value)}
                />
              </div>
            ) : null}
            <div>
              <Button size="sm" disabled={saving || !exceptionDate} onClick={addException}>
                Save exception
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
