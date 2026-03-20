'use client'

import {
  Activity,
  History,
  Lightbulb,
  MessageSquare,
  MessagesSquare,
  ScanSearch,
  ShieldAlert,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type NewsEditorRightPanelKey =
  | 'comments'
  | 'chat'
  | 'activity'
  | 'versions'
  | 'review'
  | 'plagiarism'
  | 'tips'

type NewsEditorRightRailProps = {
  activePanel: NewsEditorRightPanelKey | null
  onTogglePanel: (panel: NewsEditorRightPanelKey) => void
  onOpenVersionHistory: () => void
  historyItemCount: number
  saveStateLabel: string
  settingsOpen?: boolean
  className?: string
}

const PANEL_ITEMS: Array<{
  key: NewsEditorRightPanelKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { key: 'comments', label: 'Comments', icon: MessageSquare },
  { key: 'chat', label: 'Chat', icon: MessagesSquare },
  { key: 'activity', label: 'Activity', icon: Activity },
  { key: 'versions', label: 'Versions', icon: History },
  { key: 'review', label: 'Review', icon: ShieldAlert },
  { key: 'plagiarism', label: 'Plagiarism', icon: ScanSearch },
  { key: 'tips', label: 'Tips', icon: Lightbulb },
]

function PanelBody({
  activePanel,
  historyItemCount,
  saveStateLabel,
  onOpenVersionHistory,
  settingsOpen = false,
}: {
  activePanel: NewsEditorRightPanelKey
  historyItemCount: number
  saveStateLabel: string
  onOpenVersionHistory: () => void
  settingsOpen?: boolean
}) {
  if (activePanel === 'comments') {
    return <p className="text-sm text-muted-foreground">Comment drafting tools are available in the floating toolbar.</p>
  }
  if (activePanel === 'chat') {
    return <p className="text-sm text-muted-foreground">AI chat can be expanded in the floating toolbar via “AI prompt”.</p>
  }
  if (activePanel === 'activity') {
    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Current save state:</p>
        <p className="font-medium text-foreground">{saveStateLabel}</p>
      </div>
    )
  }
  if (activePanel === 'versions') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {historyItemCount > 0 ? `${historyItemCount} version entries available.` : 'No version entries yet.'}
        </p>
        <Button size="sm" variant="outline" onClick={onOpenVersionHistory}>
          Open full version history
        </Button>
      </div>
    )
  }
  if (activePanel === 'review') {
    return <p className="text-sm text-muted-foreground">Run link checks during publish. Broken links will be flagged before approval.</p>
  }
  if (activePanel === 'tips') {
    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Type <span className="font-medium text-foreground">/</span> for blocks, or use <span className="font-medium text-foreground">Insert</span> for media and layout.</p>
        <p>Use headings to improve readability and generate a stronger table of contents.</p>
        <p>{settingsOpen ? 'Finish category, tags, summary, and schedule details before publishing.' : 'Open settings to complete category, tags, summary, and schedule details.'}</p>
        <p>Run <span className="font-medium text-foreground">Editorial checks</span> before submitting to catch common issues early.</p>
      </div>
    )
  }
  return <p className="text-sm text-muted-foreground">Plagiarism integration placeholder. Connect provider tooling in this panel.</p>
}

export function NewsEditorRightRail({
  activePanel,
  onTogglePanel,
  onOpenVersionHistory,
  historyItemCount,
  saveStateLabel,
  settingsOpen = false,
  className,
}: NewsEditorRightRailProps) {
  return (
    <div className={cn('fixed top-[138px] right-4 z-40 hidden items-start gap-2 xl:flex', className)}>
      {activePanel ? (
        <section className="news-editor-panel-enter w-[320px] overflow-hidden rounded-[var(--vd-radius)] border border-border bg-background shadow-xl">
          <header className="border-b border-border px-4 py-4">
            <h3 className="text-sm font-semibold">{PANEL_ITEMS.find((item) => item.key === activePanel)?.label || 'Panel'}</h3>
          </header>
          <ScrollArea className="max-h-[65vh]">
            <div className="p-4">
              <PanelBody
                activePanel={activePanel}
                historyItemCount={historyItemCount}
                saveStateLabel={saveStateLabel}
                onOpenVersionHistory={onOpenVersionHistory}
                settingsOpen={settingsOpen}
              />
            </div>
          </ScrollArea>
        </section>
      ) : null}

      <div className="flex flex-col gap-2 rounded-[var(--vd-radius)] border border-border bg-background p-1 shadow-sm">
        {PANEL_ITEMS.map((item) => {
          const Icon = item.icon
          const active = activePanel === item.key
          return (
            <Tooltip key={item.key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onTogglePanel(item.key)}
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-[8px] border-l-[3px] border-l-transparent transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]',
                    'text-muted-foreground hover:bg-accent hover:text-foreground',
                    active && 'border-l-primary bg-accent text-primary',
                  )}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">{item.label}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
