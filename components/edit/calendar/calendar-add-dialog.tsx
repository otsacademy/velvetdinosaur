'use client';

import { useState } from 'react';
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

const COLOR_CHOICES = [
  { value: 'primary', label: 'Primary' },
  { value: 'accent', label: 'Accent' },
  { value: 'destructive', label: 'Destructive' },
  { value: 'muted', label: 'Muted' }
] as const;

type CalendarAddDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
  onSubmit: (input: { label: string; color: string }) => void;
};

export function CalendarAddDialog({
  open,
  onOpenChange,
  isSaving,
  onSubmit
}: CalendarAddDialogProps) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState<string>('primary');
  const [localError, setLocalError] = useState('');

  const submit = () => {
    const clean = label.trim();
    if (!clean) {
      setLocalError('Calendar name is required.');
      return;
    }
    setLocalError('');
    onSubmit({ label: clean, color });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Calendar</DialogTitle>
          <DialogDescription>
            Create a new calendar to organize events by workflow, team, or topic.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-calendar-name">Calendar name</Label>
            <Input
              id="new-calendar-name"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Editorial, Programs, Operations"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLOR_CHOICES.map((choice) => (
                  <SelectItem key={choice.value} value={choice.value}>
                    {choice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {localError ? (
            <p className="text-xs text-red-600">{localError}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isSaving}>
            {isSaving ? 'Creating…' : 'Create calendar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
