'use client'

import { useCallback, useEffect, useState } from 'react'
import { CircleHelp, Eye, ImagePlus, PenLine, Send, Settings2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const NEWS_EDITOR_GETTING_STARTED_STORAGE_KEY = 'vd:asap-news-editor:getting-started:dismissed:v1'

const HELP_STEPS: Array<{
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    id: 'write',
    title: 'Write your article',
    description: "Start typing in the canvas. Use '/' to insert blocks and structure your draft quickly.",
    icon: PenLine,
  },
  {
    id: 'insert',
    title: 'Add media and layout blocks',
    description: 'Use Insert to add images, video, files, tables, columns, callouts, and more.',
    icon: ImagePlus,
  },
  {
    id: 'format',
    title: 'Format with toolbar + selection menu',
    description: 'Use the top toolbar for block controls, and the floating toolbar when text is selected.',
    icon: Sparkles,
  },
  {
    id: 'settings',
    title: 'Complete article details',
    description: 'Open settings to set category, tags, summary, slug, SEO, and publishing schedule.',
    icon: Settings2,
  },
  {
    id: 'preview',
    title: 'Preview before publish',
    description: 'Preview the article at any time to validate layout, media, and metadata.',
    icon: Eye,
  },
  {
    id: 'publish',
    title: 'Save draft vs publish',
    description: 'Save keeps changes in draft. Publish (or submit for approval) moves the article forward.',
    icon: Send,
  },
]

function persistDismissed(value: boolean) {
  if (typeof window === 'undefined' || !value) return
  try {
    window.localStorage.setItem(NEWS_EDITOR_GETTING_STARTED_STORAGE_KEY, '1')
  } catch {
    // localStorage can be blocked in privacy modes
  }
}

function clearDismissed() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(NEWS_EDITOR_GETTING_STARTED_STORAGE_KEY)
  } catch {
    // localStorage can be blocked in privacy modes
  }
}

function wasDismissed() {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(NEWS_EDITOR_GETTING_STARTED_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

type NewsEditorGettingStartedButtonProps = {
  className?: string
}

export function NewsEditorGettingStartedButton({ className }: NewsEditorGettingStartedButtonProps) {
  const [open, setOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    if (wasDismissed()) return
    const frame = window.requestAnimationFrame(() => {
      setOpen(true)
    })
    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [])

  const closeDialog = useCallback(() => {
    persistDismissed(dontShowAgain)
    setOpen(false)
  }, [dontShowAgain])

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className={cn('gap-1.5', className)}>
        <CircleHelp className="h-4 w-4" />
        Getting started
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            persistDismissed(dontShowAgain)
          }
          setOpen(nextOpen)
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>News Editor Getting Started</DialogTitle>
            <DialogDescription>Quick guide for writing, formatting, and publishing articles.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            {HELP_STEPS.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.id} className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Icon className="h-4 w-4 text-primary" />
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="news-editor-getting-started-dismiss"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <Label htmlFor="news-editor-getting-started-dismiss" className="text-sm text-muted-foreground">
              Don&apos;t show this again on this browser
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setDontShowAgain(false)
                clearDismissed()
              }}
            >
              Show every time
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button onClick={closeDialog}>Done</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
