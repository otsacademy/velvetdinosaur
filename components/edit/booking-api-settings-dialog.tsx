'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BookingSettingsItem } from '@/components/edit/booking-api-shared';

type SettingsForm = {
  timezone: string;
  slotGranularityMinutes: string;
  minLeadTimeHours: string;
  maxAdvanceDays: string;
  autoConfirm: boolean;
  notifyEmail: string;
  cancellationCutoffHours: string;
};

function toForm(settings: BookingSettingsItem): SettingsForm {
  return {
    timezone: settings.timezone,
    slotGranularityMinutes: String(settings.slotGranularityMinutes),
    minLeadTimeHours: String(settings.minLeadTimeHours),
    maxAdvanceDays: String(settings.maxAdvanceDays),
    autoConfirm: settings.autoConfirm,
    notifyEmail: settings.notifyEmail,
    cancellationCutoffHours: String(settings.cancellationCutoffHours)
  };
}

export function BookingApiSettingsDialog({
  open,
  settings,
  saving,
  onOpenChange,
  onSave
}: {
  open: boolean;
  settings: BookingSettingsItem | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: Partial<BookingSettingsItem>) => Promise<boolean>;
}) {
  const [form, setForm] = useState<SettingsForm | null>(settings ? toForm(settings) : null);

  useEffect(() => {
    if (open && settings) setForm(toForm(settings));
  }, [open, settings]);

  if (!form) return null;

  async function submit() {
    if (!form) return;
    const ok = await onSave({
      timezone: form.timezone,
      slotGranularityMinutes: Number(form.slotGranularityMinutes),
      minLeadTimeHours: Number(form.minLeadTimeHours),
      maxAdvanceDays: Number(form.maxAdvanceDays),
      autoConfirm: form.autoConfirm,
      notifyEmail: form.notifyEmail,
      cancellationCutoffHours: Number(form.cancellationCutoffHours)
    });
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Booking settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="bs-timezone">Timezone</Label>
            <Input
              id="bs-timezone"
              value={form.timezone}
              onChange={(event) => setForm({ ...form, timezone: event.target.value })}
              placeholder="Europe/London"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bs-granularity">Slot every (min)</Label>
              <Input
                id="bs-granularity"
                type="number"
                min={5}
                value={form.slotGranularityMinutes}
                onChange={(event) => setForm({ ...form, slotGranularityMinutes: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bs-lead">Min notice (hours)</Label>
              <Input
                id="bs-lead"
                type="number"
                min={0}
                value={form.minLeadTimeHours}
                onChange={(event) => setForm({ ...form, minLeadTimeHours: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bs-advance">Book up to (days ahead)</Label>
              <Input
                id="bs-advance"
                type="number"
                min={1}
                value={form.maxAdvanceDays}
                onChange={(event) => setForm({ ...form, maxAdvanceDays: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bs-cutoff">Cancel cutoff (hours)</Label>
              <Input
                id="bs-cutoff"
                type="number"
                min={0}
                value={form.cancellationCutoffHours}
                onChange={(event) => setForm({ ...form, cancellationCutoffHours: event.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bs-notify">New-booking notification email</Label>
            <Input
              id="bs-notify"
              type="email"
              value={form.notifyEmail}
              onChange={(event) => setForm({ ...form, notifyEmail: event.target.value })}
              placeholder="you@yourbusiness.co.uk"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.autoConfirm}
              onCheckedChange={(checked) => setForm({ ...form, autoConfirm: checked === true })}
            />
            Confirm bookings automatically (no manual approval)
          </label>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
