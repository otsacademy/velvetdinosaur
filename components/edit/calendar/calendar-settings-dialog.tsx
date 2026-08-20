'use client';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type CalendarSettingsState } from '@/components/edit/calendar-workspace.shared';

type CalendarSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: CalendarSettingsState;
  onChange: (value: CalendarSettingsState) => void;
};

const DAY_KEYS: Array<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'> = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun'
];

export function CalendarSettingsDialog({ open, onOpenChange, value, onChange }: CalendarSettingsDialogProps) {
  const setValue = <K extends keyof CalendarSettingsState>(key: K, next: CalendarSettingsState[K]) => {
    onChange({ ...value, [key]: next });
  };

  const toggleWorkingDay = (day: (typeof DAY_KEYS)[number]) => {
    const current = new Set(value.workingDays);
    if (current.has(day)) current.delete(day);
    else current.add(day);
    setValue('workingDays', DAY_KEYS.filter((item) => current.has(item)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calendar Settings</DialogTitle>
          <DialogDescription>Manage layout, integrations, and advanced scheduling defaults.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="layout" className="space-y-4">
          <TabsList className="w-full" fullWidth>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="layout" className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Hour height</Label>
                <span className="text-xs text-[var(--vd-muted-fg)]">{value.hourHeight}px</span>
              </div>
              <Slider
                value={[value.hourHeight]}
                min={40}
                max={120}
                step={4}
                onValueChange={([next]) => setValue('hourHeight', next || value.hourHeight)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Snap interval</Label>
                <Select
                  value={String(value.snapMinutes)}
                  onValueChange={(next) => setValue('snapMinutes', Number(next) as 15 | 30 | 60)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Week starts on</Label>
                <Select value={value.weekStartsOn} onValueChange={(next) => setValue('weekStartsOn', next as 'Sunday' | 'Monday')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sunday">Sunday</SelectItem>
                    <SelectItem value="Monday">Monday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Default view</Label>
                <Select
                  value={value.defaultView}
                  onValueChange={(next) => setValue('defaultView', next as CalendarSettingsState['defaultView'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Day">Day</SelectItem>
                    <SelectItem value="Week">Week</SelectItem>
                    <SelectItem value="Month">Month</SelectItem>
                    <SelectItem value="Agenda">Agenda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-3">
            <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-3 text-sm">
              <p className="font-medium text-[var(--vd-fg)]">Google Calendar</p>
              <p className="text-[var(--vd-muted-fg)]">Connection management available in full integration settings.</p>
            </div>
            <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-3 text-sm">
              <p className="font-medium text-[var(--vd-fg)]">Zoom</p>
              <p className="text-[var(--vd-muted-fg)]">Add meeting links automatically when online meetings are selected.</p>
            </div>
            <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-3 text-sm">
              <p className="font-medium text-[var(--vd-fg)]">Microsoft Teams</p>
              <p className="text-[var(--vd-muted-fg)]">Connect Teams to support hybrid and online workflows.</p>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-5">
            <div className="space-y-1.5">
              <Label>Working days</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {DAY_KEYS.map((day) => {
                  const active = value.workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWorkingDay(day)}
                      className={`rounded-[var(--vd-radius)] border px-2.5 py-1 text-xs ${
                        active
                          ? 'border-[var(--vd-ring)] bg-[var(--vd-muted)]/70 text-[var(--vd-fg)]'
                          : 'border-[var(--vd-border)] text-[var(--vd-muted-fg)]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="work-start">Work start hour</Label>
                <Input
                  id="work-start"
                  type="number"
                  min={0}
                  max={23}
                  value={value.workStartHour}
                  onChange={(event) => setValue('workStartHour', Number(event.target.value) || 9)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="work-end">Work end hour</Label>
                <Input
                  id="work-end"
                  type="number"
                  min={0}
                  max={23}
                  value={value.workEndHour}
                  onChange={(event) => setValue('workEndHour', Number(event.target.value) || 17)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="primary-timezone">Primary timezone</Label>
                <Input
                  id="primary-timezone"
                  value={value.primaryTimezone}
                  onChange={(event) => setValue('primaryTimezone', event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="secondary-timezone">Secondary timezone</Label>
                <Input
                  id="secondary-timezone"
                  value={value.secondaryTimezone}
                  onChange={(event) => setValue('secondaryTimezone', event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meeting-duration">Default meeting duration (min)</Label>
                <Input
                  id="meeting-duration"
                  type="number"
                  min={15}
                  max={240}
                  value={value.defaultMeetingDuration}
                  onChange={(event) => setValue('defaultMeetingDuration', Number(event.target.value) || 60)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Default conferencing tool</Label>
                <Select
                  value={value.defaultConferencing}
                  onValueChange={(next) => setValue('defaultConferencing', next as CalendarSettingsState['defaultConferencing'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="google-meet">Google Meet</SelectItem>
                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={value.speedyMeetings}
                onCheckedChange={(checked) => setValue('speedyMeetings', checked)}
              />
              <Label>Speedy meetings (shorten back-to-back meetings)</Label>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
