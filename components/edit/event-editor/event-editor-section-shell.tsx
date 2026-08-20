'use client'

import type { ReactNode } from 'react'

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

type EventEditorSectionShellProps = {
  value: string
  title: string
  description: string
  children: ReactNode
}

export function EventEditorSectionShell({
  value,
  title,
  description,
  children,
}: EventEditorSectionShellProps) {
  return (
    <AccordionItem value={value} className="rounded-lg border border-border/70 bg-background px-4">
      <AccordionTrigger className="py-4 text-left hover:no-underline">
        <span className="space-y-1">
          <span className="block text-sm font-semibold text-foreground">{title}</span>
          <span className="block text-xs text-muted-foreground">{description}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-5 pt-1">{children}</AccordionContent>
    </AccordionItem>
  )
}
