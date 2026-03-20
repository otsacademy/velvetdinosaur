import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'

type ReadArticleCtaProps = {
  className?: string
}

export function ReadArticleCta({ className }: ReadArticleCtaProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium text-accent transition-transform duration-200 group-hover:translate-x-0.5',
        className,
      )}
    >
      Read article
      <ArrowRight className="h-4 w-4" />
    </span>
  )
}
