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
}

function getStatus(article: WorkArticleRow) {
  if (article.pendingPublishRequestedAt) {
    return {
      label: 'Needs approval',
      className: 'border-transparent bg-amber-100 text-amber-900',
    }
  }

  if (article.status === 'published') {
    return {
      label: 'Live',
      className: 'border-transparent bg-[var(--vd-accent)] text-[var(--vd-accent-fg)]',
    }
  }

  if (article.status === 'scheduled') {
    return {
      label: 'Scheduled',
      className: 'border-transparent bg-sky-100 text-sky-900',
    }
  }

  return {
    label: 'Draft',
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

export function EditIndexWorkTable({ articles, viewMode }: EditIndexWorkTableProps) {
  const router = useRouter()

  const handleDelete = async (slug: string) => {
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
            <Card key={article.slug} className="space-y-3 border border-transparent bg-[var(--vd-card)] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="line-clamp-2 text-base font-semibold text-[var(--vd-fg)]">{article.title}</p>
                  <p className="text-xs text-[var(--vd-muted-fg)]">
                    {article.tag} {' • '} {article.authorName}
                  </p>
                  <p className="truncate text-xs text-[var(--vd-muted-fg)]">/work/{article.slug}</p>
                </div>
                <Badge className={cn(status.className)}>{status.label}</Badge>
              </div>

              <p className="text-xs text-[var(--vd-muted-fg)]">
                Last updated: {formatWhen(article.updatedAt || article.date)}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button size="sm" variant="outline" asChild>
                  <Link href={previewHref} target="_blank" rel="noreferrer">
                    <Eye className="h-4 w-4" />
                    Preview
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={editHref}>Edit</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Work article actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
    <div className="overflow-hidden rounded-[var(--vd-radius)] bg-[var(--vd-card)] shadow-sm">
      <Table className="text-sm text-[var(--vd-fg)]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[55%] text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">
              Article
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">Status</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">Updated</TableHead>
            <TableHead className="text-right text-xs uppercase tracking-wider text-[var(--vd-muted-fg)]">
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
              <TableRow key={article.slug}>
                <TableCell className="py-3 align-top whitespace-normal">
                  <div className="space-y-1">
                    <Link href={editHref} className="text-sm font-semibold text-[var(--vd-fg)] hover:underline">
                      {article.title}
                    </Link>
                    <p className="text-xs text-[var(--vd-muted-fg)]">
                      {article.tag} {' • '} {article.authorName}
                    </p>
                    <p className="truncate text-xs text-[var(--vd-muted-fg)]">/work/{article.slug}</p>
                  </div>
                </TableCell>
                <TableCell className="align-top whitespace-normal">
                  <Badge className={cn(status.className)}>{status.label}</Badge>
                </TableCell>
                <TableCell className="align-top">
                  <div className="space-y-1 text-xs text-[var(--vd-muted-fg)]">
                    <p>{formatWhen(article.updatedAt || article.date)}</p>
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={previewHref} target="_blank" rel="noreferrer">
                        <Eye className="h-4 w-4" />
                        Preview
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Work article actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
