'use client'

import Link from 'next/link'
import { Copy, Eye, MoreHorizontal, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/new-york-v4/ui/table'
import { cn } from '@/lib/utils'
import type { ViewMode, WorkArticleRow } from '@/components/edit/pages-index-types'

type EditIndexWorkTableProps = {
  articles: WorkArticleRow[]
  viewMode: ViewMode
  mode?: 'live' | 'demo'
  onDemoAction?: (label: string) => void
}

function getStatus(article: WorkArticleRow) {
  if (article.pendingPublishRequestedAt) {
    return {
      label: 'Needs approval',
      tone: 'approval' as const,
      className:
        'border-transparent bg-[color-mix(in_oklch,var(--destructive)_16%,var(--vd-bg))] text-[color-mix(in_oklch,var(--destructive)_62%,var(--vd-fg))]',
    }
  }

  if (article.status === 'published') {
    return {
      label: 'Live',
      tone: 'live' as const,
      className:
        'border-transparent bg-[color-mix(in_oklch,var(--vd-score-perfect)_18%,var(--vd-bg))] text-[color-mix(in_oklch,var(--vd-score-perfect)_72%,var(--vd-fg))]',
    }
  }

  if (article.status === 'scheduled') {
    return {
      label: 'Scheduled',
      tone: 'scheduled' as const,
      className:
        'border-transparent bg-[color-mix(in_oklch,var(--vd-primary)_16%,var(--vd-bg))] text-[color-mix(in_oklch,var(--vd-primary)_72%,var(--vd-fg))]',
    }
  }

  return {
    label: 'Draft',
    tone: 'draft' as const,
    className: 'bg-[var(--vd-muted)] text-[var(--vd-muted-fg)]',
  }
}

function formatWhen(value?: string | null) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

async function deleteArticle(slug: string) {
  const response = await fetch(`/api/work/articles/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error((payload as { error?: string })?.error || 'Delete failed')
  }
}

export function EditIndexWorkTable({
  articles,
  viewMode,
  mode = 'live',
  onDemoAction,
}: EditIndexWorkTableProps) {
  const router = useRouter()
  const isDemo = mode === 'demo'

  const handleDelete = async (slug: string) => {
    if (isDemo) {
      onDemoAction?.(`Delete work article "${slug}"`)
      return
    }

    const confirmed = window.confirm(`Delete work article "${slug}"? This cannot be undone.`)
    if (!confirmed) return

    try {
      await deleteArticle(slug)
      toast.success(`Deleted work article "${slug}"`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed')
    }
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => {
          const status = getStatus(article)
          const editHref = `/edit/work/${encodeURIComponent(article.slug)}`
          const previewHref = `/preview/work/${encodeURIComponent(article.slug)}`
          const liveHref = `/work/${encodeURIComponent(article.slug)}`

          return (
            <Card
              key={article.slug}
              className={cn(
                'space-y-3 border border-transparent bg-[var(--vd-card)] p-5 shadow-sm',
                isDemo && 'vd-demo-grid-card'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="line-clamp-2 text-base font-semibold text-[var(--vd-fg)]">{article.title}</p>
                  <p className="text-xs text-[var(--vd-muted-fg)]">
                    {article.tag} {' • '} {article.authorName}
                  </p>
                  <p className="truncate text-xs text-[var(--vd-muted-fg)]">/work/{article.slug}</p>
                </div>
                <Badge className={cn(isDemo ? 'vd-demo-status-badge' : status.className)} data-tone={status.tone}>
                  {status.label}
                </Badge>
              </div>

              <p className="text-xs text-[var(--vd-muted-fg)]">
                Last updated: {formatWhen(article.updatedAt || article.date)}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {isDemo ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="vd-demo-toolbar-button vd-demo-toolbar-button-subtle"
                      onClick={() => onDemoAction?.(`Preview /work/${article.slug}`)}
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      className="vd-demo-toolbar-button vd-demo-toolbar-button-primary"
                      onClick={() => onDemoAction?.(`Edit /work/${article.slug}`)}
                    >
                      Edit
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={previewHref} target="_blank" rel="noreferrer">
                        <Eye className="h-4 w-4" />
                        Preview
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={editHref}>Edit</Link>
                    </Button>
                  </>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className={cn('h-9 w-9 p-0', isDemo && 'vd-demo-icon-button')}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Work article actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isDemo ? (
                      <>
                        <DropdownMenuItem onSelect={() => onDemoAction?.(`Edit /work/${article.slug}`)}>
                          Edit article
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onDemoAction?.(`Duplicate /work/${article.slug}`)}>
                          <Copy className="h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onDemoAction?.(`View live /work/${article.slug}`)}>
                          View live
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={editHref}>Edit article</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/edit/work/new?slug=${encodeURIComponent(article.slug)}&duplicate=1`}>
                            <Copy className="h-4 w-4" />
                            Duplicate
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={liveHref} target="_blank" rel="noreferrer">
                            View live
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => void handleDelete(article.slug)} className="text-rose-600">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('overflow-hidden rounded-[var(--vd-radius)] bg-[var(--vd-card)] shadow-sm', isDemo && 'vd-demo-table-shell')}>
      <Table className="text-sm text-[var(--vd-fg)]">
        <TableHeader>
          <TableRow>
            <TableHead className={cn('w-[55%] text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]', isDemo && 'vd-demo-table-head')}>
              Article
            </TableHead>
            <TableHead className={cn('text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]', isDemo && 'vd-demo-table-head')}>
              Status
            </TableHead>
            <TableHead className={cn('text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]', isDemo && 'vd-demo-table-head')}>
              Updated
            </TableHead>
            <TableHead
              className={cn(
                'text-right text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]',
                isDemo && 'vd-demo-table-head'
              )}
            >
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => {
            const status = getStatus(article)
            const editHref = `/edit/work/${encodeURIComponent(article.slug)}`
            const previewHref = `/preview/work/${encodeURIComponent(article.slug)}`
            const liveHref = `/work/${encodeURIComponent(article.slug)}`

            return (
              <TableRow key={article.slug} className={cn(isDemo && 'vd-demo-table-row')}>
                <TableCell className={cn('py-3 align-top whitespace-normal', isDemo && 'vd-demo-table-cell-leading')}>
                  <div className="space-y-1">
                    {isDemo ? (
                      <button
                        type="button"
                        className={cn(
                          'text-left text-sm font-semibold text-[var(--vd-fg)]',
                          isDemo ? 'vd-demo-row-link' : 'hover:underline'
                        )}
                        onClick={() => onDemoAction?.(`Edit /work/${article.slug}`)}
                      >
                        {article.title}
                      </button>
                    ) : (
                      <Link
                        href={editHref}
                        className={cn(
                          'text-sm font-semibold text-[var(--vd-fg)]',
                          isDemo ? 'vd-demo-row-link' : 'hover:underline'
                        )}
                      >
                        {article.title}
                      </Link>
                    )}
                    <p className="text-xs text-[var(--vd-muted-fg)]">
                      {article.tag} {' • '} {article.authorName}
                    </p>
                    <p className="truncate text-xs text-[var(--vd-muted-fg)]">/work/{article.slug}</p>
                  </div>
                </TableCell>
                <TableCell className="align-top whitespace-normal">
                  <Badge className={cn(isDemo ? 'vd-demo-status-badge' : status.className)} data-tone={status.tone}>
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="align-top">
                  <div className="space-y-1 text-xs text-[var(--vd-muted-fg)]">
                    <p>{formatWhen(article.updatedAt || article.date)}</p>
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="flex items-center justify-end gap-2">
                    {isDemo ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(isDemo && 'vd-demo-ghost-button')}
                        onClick={() => onDemoAction?.(`Preview /work/${article.slug}`)}
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className={cn(isDemo && 'vd-demo-ghost-button')} asChild>
                        <Link href={previewHref} target="_blank" rel="noreferrer">
                          <Eye className="h-4 w-4" />
                          Preview
                        </Link>
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn('h-9 w-9 p-0', isDemo && 'vd-demo-icon-button')}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Work article actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isDemo ? (
                          <>
                            <DropdownMenuItem onSelect={() => onDemoAction?.(`Edit /work/${article.slug}`)}>
                              Edit article
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onDemoAction?.(`Duplicate /work/${article.slug}`)}>
                              <Copy className="h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onDemoAction?.(`View live /work/${article.slug}`)}>
                              View live
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={editHref}>Edit article</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/edit/work/new?slug=${encodeURIComponent(article.slug)}&duplicate=1`}>
                                <Copy className="h-4 w-4" />
                                Duplicate
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={liveHref} target="_blank" rel="noreferrer">
                                View live
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => void handleDelete(article.slug)} className="text-rose-600">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
