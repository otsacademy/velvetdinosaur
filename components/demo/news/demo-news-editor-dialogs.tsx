'use client';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type DemoNewsHistoryItem } from '@/lib/demo-news-seed';

type DemoNewsEditorDialogsProps = {
  scheduleDialogOpen: boolean;
  scheduleDialogValue: string;
  onScheduleDialogOpenChange: (open: boolean) => void;
  onScheduleDialogValueChange: (value: string) => void;
  onScheduleConfirm: () => void;
  historyOpen: boolean;
  historyItems: DemoNewsHistoryItem[];
  onHistoryOpenChange: (open: boolean) => void;
  onRestoreHistoryItem: (id: string) => void;
  leaveDialogOpen: boolean;
  onLeaveDialogOpenChange: (open: boolean) => void;
  onCancelLeave: () => void;
  onConfirmLeave: () => void;
};

export function DemoNewsEditorDialogs({
  scheduleDialogOpen,
  scheduleDialogValue,
  onScheduleDialogOpenChange,
  onScheduleDialogValueChange,
  onScheduleConfirm,
  historyOpen,
  historyItems,
  onHistoryOpenChange,
  onRestoreHistoryItem,
  leaveDialogOpen,
  onLeaveDialogOpenChange,
  onCancelLeave,
  onConfirmLeave,
}: DemoNewsEditorDialogsProps) {
  return (
    <>
      <Dialog open={scheduleDialogOpen} onOpenChange={onScheduleDialogOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule publication</DialogTitle>
            <DialogDescription>Choose the demo publish date and time in Europe/London.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="demo-news-schedule">Publish at (Europe/London)</Label>
            <Input
              id="demo-news-schedule"
              type="datetime-local"
              value={scheduleDialogValue}
              onChange={(event) => onScheduleDialogValueChange(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onScheduleDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onScheduleConfirm}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={onHistoryOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Article history</DialogTitle>
            <DialogDescription>Restore a previous saved demo version.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] space-y-2 overflow-auto py-2">
            {!historyItems.length ? <p className="text-sm text-muted-foreground">No saved demo versions yet.</p> : null}
            {historyItems.map((item) => (
              <div key={item.id} className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()} • {item.status}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onRestoreHistoryItem(item.id)}>
                    Restore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={leaveDialogOpen} onOpenChange={onLeaveDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              This demo article has unsaved changes. Leaving now will discard them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelLeave}>Stay here</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmLeave}>Leave page</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
