'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type EventChapterBadgeProps = {
  chapterName?: string | null
  className?: string
}

export function EventChapterBadge({ chapterName, className }: EventChapterBadgeProps) {
  const label = typeof chapterName === 'string' ? chapterName.trim() : ''
  if (!label) return null

  return (
    <Badge variant="outline" className={cn('border-border/70 text-muted-foreground', className)}>
      {label}
    </Badge>
  )
}
