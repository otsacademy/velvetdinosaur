'use client';

import { useState } from 'react';
import { Bell, CalendarDays, CheckSquare2, PlaneTakeoff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { type CalendarRecord, type CalendarEventType, type EventDraft } from '@/components/edit/calendar-workspace.shared';

const EVENT_TYPES: Array<{ key: CalendarEventType; label: string; icon: typeof CalendarDays }> = [
  { key: 'event', label: 'Event', icon: CalendarDays },
  { key: 'task', label: 'Task', icon: CheckSquare2 },
  { key: 'reminder', label: 'Reminder', icon: Bell },
  { key: 'out-of-office', label: 'Out of Office', icon: PlaneTakeoff }
];

const MEETING_TYPES: Array<{ key: string; label: string }> = [
  { key: 'none', label: 'None' },
  { key: 'in-person', label: 'In person' },
  { key: 'online', label: 'Online' },
  { key: 'hybrid', label: 'Hybrid' }
];

const COLOR_CHOICES = [
  { key: 'primary', label: 'Primary' },
  { key: 'accent', label: 'Accent' },
  { key: 'destructive', label: 'Destructive' },
  { key: 'muted', label: 'Muted' }
];

type CalendarEventDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: EventDraft;
  onChangeDraft: (draft: EventDraft) => void;
  calendars: CalendarRecord[];
  isSaving: boolean;
  onSubmit: () => void;
  mode: 'create' | 'edit';
};

export function CalendarEventDialog({
  open,
  onOpenChange,
  draft,
  onChangeDraft,
  calendars,
  isSaving,
  onSubmit,
  mode
}: CalendarEventDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const meetingTypeValue = draft.meetingType || 'none';

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setStep(1);
    onOpenChange(nextOpen);
  };

  const setValue = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => {
    onChangeDraft({ ...draft, [key]: value });
  };

  const updateCalendarFromId = (nextId: string) => {
    const selected = calendars.find((calendar) => calendar.id === nextId) || calendars[0];
    if (!selected) return;
    onChangeDraft({
      ...draft,
      calendarId: selected.id,
      calendarName: selected.label,
      calendarColor: selected.color
    });
  };

  const canContinue = draft.title.trim().length > 0 && draft.startDateKey.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New Event' : 'Edit Event'}</DialogTitle>
          <DialogDescription>
            Organize essentials first, then add optional details for attendees and context.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-muted)]/25 p-3">
            <div className="flex items-center justify-between gap-2 text-xs text-[var(--vd-muted-fg)]">
              <span className="font-medium text-[var(--vd-fg)]">
                {step === 1 ? 'Step 1: Essentials' : 'Step 2: Optional details'}
              </span>
              <span>Step {step} of 2</span>
            </div>
            <Progress value={step === 1 ? 50 : 100} className="mt-2 h-1.5" />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={cn(
                  'rounded-[var(--vd-radius)] border px-2 py-1 text-[11px] font-medium',
                  step === 1
                    ? 'border-[var(--vd-ring)] bg-[var(--vd-card)] text-[var(--vd-fg)]'
                    : 'border-[var(--vd-border)] text-[var(--vd-muted-fg)]'
                )}
              >
                1. Essentials
              </button>
              <button
                type="button"
                onClick={() => {
                  if (canContinue) setStep(2);
                }}
                disabled={!canContinue}
                className={cn(
                  'rounded-[var(--vd-radius)] border px-2 py-1 text-[11px] font-medium',
                  step === 2
                    ? 'border-[var(--vd-ring)] bg-[var(--vd-card)] text-[var(--vd-fg)]'
                    : 'border-[var(--vd-border)] text-[var(--vd-muted-fg)]',
                  !canContinue ? 'opacity-50' : ''
                )}
              >
                2. Optional details
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {EVENT_TYPES.map((eventType) => {
              const Icon = eventType.icon;
              return (
                <button
                  key={eventType.key}
                  type="button"
                  onClick={() => setValue('eventType', eventType.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-[var(--vd-radius)] border px-2.5 py-1 text-xs font-medium',
                    draft.eventType === eventType.key
                      ? 'border-[var(--vd-ring)] bg-[var(--vd-muted)]/70 text-[var(--vd-fg)]'
                      : 'border-[var(--vd-border)] text-[var(--vd-muted-fg)] hover:bg-[var(--vd-muted)]/40'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {eventType.label}
                </button>
              );
            })}
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-[var(--vd-muted-fg)]">BASICS</p>
                  <span className="h-px flex-1 bg-[var(--vd-accent)]/50" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="event-title">Title</Label>
                    <Input
                      id="event-title"
                      value={draft.title}
                      onChange={(event) => setValue('title', event.target.value)}
                      placeholder="Event title"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Calendar</Label>
                    <Select value={draft.calendarId} onValueChange={updateCalendarFromId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select calendar" />
                      </SelectTrigger>
                      <SelectContent>
                        {calendars.map((calendar) => (
                          <SelectItem key={calendar.id} value={calendar.id}>
                            {calendar.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Reminder</Label>
                    <Select
                      value={draft.reminderMinutes}
                      onValueChange={(value) => setValue('reminderMinutes', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Reminder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="1440">1 day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-[var(--vd-muted-fg)]">SCHEDULE</p>
                  <span className="h-px flex-1 bg-[var(--vd-accent)]/50" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="event-start-date">Start date</Label>
                    <Input
                      id="event-start-date"
                      type="date"
                      value={draft.startDateKey}
                      onChange={(event) => setValue('startDateKey', event.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="event-end-date">End date</Label>
                    <Input
                      id="event-end-date"
                      type="date"
                      value={draft.endDateKey}
                      onChange={(event) => setValue('endDateKey', event.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="event-start-time">Start time</Label>
                    <Input
                      id="event-start-time"
                      type="time"
                      value={draft.startTime}
                      disabled={draft.allDay}
                      onChange={(event) => setValue('startTime', event.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="event-end-time">End time</Label>
                    <Input
                      id="event-end-time"
                      type="time"
                      value={draft.endTime}
                      disabled={draft.allDay}
                      onChange={(event) => setValue('endTime', event.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Repeat</Label>
                    <Select value={draft.repeat} onValueChange={(value) => setValue('repeat', value as EventDraft['repeat'])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Does not repeat</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={draft.allDay}
                      onCheckedChange={(checked) => setValue('allDay', checked)}
                    />
                    <Label>All day</Label>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <p className="text-[11px] font-semibold tracking-[0.12em] text-[var(--vd-muted-fg)]">DETAILS</p>
                <span className="h-px flex-1 bg-[var(--vd-accent)]/50" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Meeting type</Label>
                  <Select
                    value={meetingTypeValue}
                    onValueChange={(value) =>
                      setValue('meetingType', (value === 'none' ? '' : value) as EventDraft['meetingType'])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Meeting type" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEETING_TYPES.map((meetingType) => (
                        <SelectItem key={meetingType.key} value={meetingType.key}>
                          {meetingType.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Event color</Label>
                  <Select value={draft.calendarColor} onValueChange={(value) => setValue('calendarColor', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_CHOICES.map((choice) => (
                        <SelectItem key={choice.key} value={choice.key}>
                          {choice.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="event-location">Location</Label>
                  <Input
                    id="event-location"
                    value={draft.location}
                    onChange={(event) => setValue('location', event.target.value)}
                    placeholder="In person location or meeting link"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="event-guests">Guests</Label>
                  <Input
                    id="event-guests"
                    value={draft.guests}
                    onChange={(event) => setValue('guests', event.target.value)}
                    placeholder="Comma-separated names or emails"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="event-category">Category</Label>
                  <Input
                    id="event-category"
                    value={draft.category}
                    onChange={(event) => setValue('category', event.target.value)}
                    placeholder="Editorial, Research, Ops"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="event-description">Description</Label>
                  <Textarea
                    id="event-description"
                    value={draft.description}
                    onChange={(event) => setValue('description', event.target.value)}
                    className="min-h-[140px]"
                    placeholder="Optional details for participants"
                  />
                </div>
              </div>
            </section>
          )}
        </div>

        <DialogFooter>
          {step === 2 ? (
            <Button variant="outline" onClick={() => setStep(1)} disabled={isSaving}>
              Back
            </Button>
          ) : null}

          {step === 1 ? (
            <Button onClick={() => setStep(2)} disabled={!canContinue}>
              Continue
            </Button>
          ) : (
            <Button onClick={onSubmit} disabled={isSaving}>
              {isSaving ? (mode === 'create' ? 'Creating…' : 'Saving…') : mode === 'create' ? 'Create event' : 'Save event'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
