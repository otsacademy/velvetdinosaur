'use client'

import { CheckCircle2, Circle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

type RequiredFieldItem = {
  id: string
  label: string
  complete: boolean
  section: string
}

type NewsEditorReadinessCardProps = {
  completeRequired: number
  requiredTotal: number
  completionPercent: number
  requiredExpanded: boolean
  onToggleRequiredExpanded: () => void
  requiredFieldItems: RequiredFieldItem[]
  onJumpToSection: (section: string) => void
  editorialWarnings: string[]
  onRunEditorialFixes?: () => void
  editorialFixDisabled?: boolean
}

export function NewsEditorReadinessCard({
  completeRequired,
  requiredTotal,
  completionPercent,
  requiredExpanded,
  onToggleRequiredExpanded,
  requiredFieldItems,
  onJumpToSection,
  editorialWarnings,
  onRunEditorialFixes,
  editorialFixDisabled = false,
}: NewsEditorReadinessCardProps) {
  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Completion</span>
          <span>
            {completeRequired} of {requiredTotal} required fields complete
          </span>
        </div>
        <Progress value={completionPercent} aria-label="Required field completion" />
        <button
          type="button"
          onClick={onToggleRequiredExpanded}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          {requiredExpanded ? 'Hide required fields' : 'Show required fields'}
        </button>
        {requiredExpanded ? (
          <div className="space-y-1 rounded-md border border-border/60 bg-muted/20 p-2">
            {requiredFieldItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => onJumpToSection(item.section)}
                className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-xs hover:bg-muted/40"
              >
                <span className="inline-flex items-center gap-2 text-foreground">
                  {item.complete ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  {item.label}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.section}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-1 rounded-md border border-border/60 bg-muted/20 p-2 text-xs">
        <p className="font-medium text-foreground">Editorial checks</p>
        {editorialWarnings.length > 0 ? (
          <div className="space-y-1 text-muted-foreground">
            {editorialWarnings.map((warning) => (
              <p key={warning}>• {warning}</p>
            ))}
          </div>
        ) : (
          <p className="text-emerald-700">Structure and metadata checks look healthy.</p>
        )}
        {editorialWarnings.length > 0 && onRunEditorialFixes ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRunEditorialFixes}
            disabled={editorialFixDisabled}
            className="mt-2"
          >
            Apply quick fixes
          </Button>
        ) : null}
      </div>
    </>
  )
}
