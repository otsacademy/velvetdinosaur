'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Monitor, Smartphone, Tablet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type PreviewViewport = 'mobile' | 'tablet' | 'desktop'

const STORAGE_KEY = 'asap:preview-viewport'

type Preset = {
  value: PreviewViewport
  label: string
  icon: typeof Monitor
  maxWidth: string
}

const PRESETS: Preset[] = [
  {
    value: 'mobile',
    label: 'Mobile',
    icon: Smartphone,
    maxWidth: 'max-w-[420px]',
  },
  {
    value: 'tablet',
    label: 'Tablet',
    icon: Tablet,
    maxWidth: 'max-w-[768px]',
  },
  {
    value: 'desktop',
    label: 'Desktop',
    icon: Monitor,
    maxWidth: 'max-w-[1440px]',
  },
]

type PreviewViewportShellProps = {
  children: React.ReactNode
  showControls?: boolean
  label?: string
  className?: string
}

function parseStoredViewport(value: string): PreviewViewport {
  return value === 'mobile' || value === 'tablet' || value === 'desktop' ? value : 'desktop'
}

export function PreviewViewportShell({
  children,
  showControls = true,
  label = 'Preview viewport',
  className,
}: PreviewViewportShellProps) {
  const [viewport, setViewport] = useState<PreviewViewport>(() => {
    if (typeof window === 'undefined') return 'desktop'
    return parseStoredViewport(window.localStorage.getItem(STORAGE_KEY) || 'desktop')
  })

  const activePreset = useMemo(() => PRESETS.find((entry) => entry.value === viewport) ?? PRESETS[2], [viewport])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, viewport)
  }, [viewport])

  const onViewportChange = useCallback((next: PreviewViewport) => setViewport(next), [])

  return (
    <div className={cn('w-full', className)}>
      {showControls ? (
        <div className="sticky top-0 z-30 border-b border-[var(--vd-border)] bg-[var(--vd-bg)]/90 p-2 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[var(--vd-muted-fg)]">{label}</p>
            <div className="flex items-center gap-2">
              {PRESETS.map((preset) => {
                const Icon = preset.icon
                const isActive = activePreset.value === preset.value
                return (
                  <Button
                    key={preset.value}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onViewportChange(preset.value)}
                  >
                    <Icon className="h-4 w-4" />
                    {preset.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
      <div className="w-full px-2 py-3 md:px-4 lg:px-6">
        <div className={cn('mx-auto w-full', activePreset.maxWidth)}>
          {children}
        </div>
      </div>
    </div>
  )
}
