'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

type NewsChapterBadgeProps = {
  chapterName?: string | null
  className?: string
}

export function NewsChapterBadge({ chapterName, className }: NewsChapterBadgeProps) {
  const label = typeof chapterName === 'string' ? chapterName.trim() : ''
  if (!label) return null

  return (
    <Badge variant="outline" className={cn('border-border/70 text-muted-foreground', className)}>
      {label}
    </Badge>
  )
}
