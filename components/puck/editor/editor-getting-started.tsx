'use client';

import * as React from 'react';
import { CircleHelp, ListTree, MousePointerClick, Palette, PlusCircle, Save, Send, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const EDITOR_GETTING_STARTED_STORAGE_KEY = 'vd:asap-editor:getting-started:dismissed:v1';

const HELP_STEPS: Array<{
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'select',
    title: 'Edit directly on the page',
    description: 'Click visible text and type. Click an image to replace, crop, align, or resize it.',
    icon: MousePointerClick
  },
  {
    id: 'components',
    title: 'Add new sections',
    description: 'Open Components and drag blocks into the page to build your layout.',
    icon: PlusCircle
  },
  {
    id: 'outline',
    title: 'Reorder quickly',
    description: 'Use Outline to drag sections up or down in page order.',
    icon: ListTree
  },
  {
    id: 'theme',
    title: 'Adjust site styling',
    description: 'Use Theme for colors and typography updates shared across the site.',
    icon: Palette
  },
  {
    id: 'save',
    title: 'Save vs publish',
    description: 'Save stores the current edit. Publish makes the saved version live or sends it for approval.',
    icon: Save
  },
  {
    id: 'publish',
    title: 'Bottom tabs overview',
    description:
      'Components, Outline, Properties, Settings, Theme, and Publish are always available in the bottom dock.',
    icon: SlidersHorizontal
  }
];

function persistDismissed(value: boolean) {
  if (typeof window === 'undefined' || !value) return;
  try {
    window.localStorage.setItem(EDITOR_GETTING_STARTED_STORAGE_KEY, '1');
  } catch {
    // localStorage may be unavailable in private browsing modes.
  }
}

function clearDismissed() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(EDITOR_GETTING_STARTED_STORAGE_KEY);
  } catch {
    // localStorage may be unavailable in private browsing modes.
  }
}

function wasDismissed() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(EDITOR_GETTING_STARTED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function EditorGettingStarted() {
  const [open, setOpen] = React.useState(false);
  const [dontShowAgain, setDontShowAgain] = React.useState(false);

  React.useEffect(() => {
    if (wasDismissed()) return;
    setOpen(true);
  }, []);

  const closeDialog = React.useCallback(() => {
    persistDismissed(dontShowAgain);
    setOpen(false);
  }, [dontShowAgain]);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <CircleHelp className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">Getting started</span>
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            persistDismissed(dontShowAgain);
          }
          setOpen(nextOpen);
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Getting Started</DialogTitle>
            <DialogDescription>
              Quick guide for editing pages in the site editor.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            {HELP_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className="rounded-lg border border-[var(--vd-border)] bg-[var(--vd-muted)]/40 p-3"
                >
                  <p className="flex items-center gap-2 text-sm font-medium text-[var(--vd-fg)]">
                    <Icon className="h-4 w-4 text-[var(--vd-primary)]" />
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs text-[var(--vd-muted-fg)]">{step.description}</p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="editor-getting-started-dismiss"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <Label htmlFor="editor-getting-started-dismiss" className="text-sm text-[var(--vd-muted-fg)]">
              Don&apos;t show this again on this browser
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setDontShowAgain(false);
                clearDismissed();
              }}
            >
              Show every time
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button onClick={closeDialog}>
                <Send className="h-4 w-4" />
                Done
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
