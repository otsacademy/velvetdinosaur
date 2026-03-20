'use client'

import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

export type NewsLinkWarning = {
  url: string
  type: 'internal' | 'external'
  reason: string
}

type ParsedWarningPayload = {
  warnings: NewsLinkWarning[]
  checkedInternal: number
  checkedExternal: number
}

function trimOrEmpty(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function parseNewsLinkWarningPayload(payload: unknown): ParsedWarningPayload {
  if (!payload || typeof payload !== 'object') {
    return { warnings: [], checkedInternal: 0, checkedExternal: 0 }
  }

  const body = payload as Record<string, unknown>
  const rawWarnings = Array.isArray(body.warnings) ? body.warnings : []

  const warnings = rawWarnings
    .map((item): NewsLinkWarning | null => {
      if (!item || typeof item !== 'object') return null
      const candidate = item as Record<string, unknown>
      const url = trimOrEmpty(candidate.url)
      const reason = trimOrEmpty(candidate.reason)
      const rawType = candidate.type
      const type = rawType === 'internal' || rawType === 'external' ? rawType : null

      if (!url || !reason || !type) return null
      return { url, reason, type }
    })
    .filter((warning): warning is NewsLinkWarning => Boolean(warning))

  const checkedInternal =
    typeof body.checkedInternal === 'number' && Number.isFinite(body.checkedInternal) ? body.checkedInternal : warnings.length
  const checkedExternal =
    typeof body.checkedExternal === 'number' && Number.isFinite(body.checkedExternal)
      ? body.checkedExternal
      : warnings.length

  return { warnings, checkedInternal, checkedExternal }
}

type NewsLinkWarningDialogProps = {
  open: boolean
  warnings: NewsLinkWarning[]
  checkedInternal: number
  checkedExternal: number
  onPublishAnyway: () => void
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
}

export function NewsLinkWarningsDialog({
  open,
  warnings,
  checkedInternal,
  checkedExternal,
  onPublishAnyway,
  onOpenChange,
  isSubmitting,
}: NewsLinkWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Broken links detected</DialogTitle>
          <DialogDescription>
            {warnings.length
              ? 'We found possible link issues in your article metadata and content.'
              : 'We could not validate links fully, but there may still be issues.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Link check summary</p>
          <div className="grid gap-2 rounded-md border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm">
            <p>
              <strong>Checked:</strong> {checkedInternal + checkedExternal} links ({checkedInternal} internal, {checkedExternal}{' '}
              external)
            </p>
            <p>
              <strong>Warnings:</strong> {warnings.length}
            </p>
          </div>

          {warnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No specific warning payload returned. You can retry with “Publish anyway”.</p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-auto">
              {warnings.map((warning) => (
                <div key={`${warning.type}:${warning.url}`} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <Badge variant="outline" className="capitalize">
                      {warning.type}
                    </Badge>
                    <span className="break-all text-xs text-muted-foreground">{warning.url}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{warning.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Close
          </Button>
          <Button onClick={onPublishAnyway} disabled={isSubmitting}>
            {isSubmitting ? 'Publishing…' : 'Publish anyway'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
