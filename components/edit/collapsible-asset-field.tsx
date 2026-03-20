/* eslint-disable @next/next/no-img-element -- editor asset previews can be remote URLs */
'use client'

import { useMemo, useState } from 'react'

import { AssetPickerField } from '@/components/puck/fields/asset-picker-field'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { resolveAssetImageUrl } from '@/lib/uploads'

type CollapsibleAssetFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function getAssetLabel(rawValue: string) {
  if (!rawValue) return 'No file selected'

  try {
    const parsed = new URL(rawValue, 'https://placeholder.local')
    const keyParam = parsed.searchParams.get('key')?.trim()
    if (keyParam) {
      const keyFileName = keyParam.split('/').filter(Boolean).pop()
      if (keyFileName) return decodeURIComponent(keyFileName)
    }
    const pathValue = parsed.pathname.split('/').filter(Boolean).pop() || parsed.pathname
    return decodeURIComponent(pathValue || rawValue)
  } catch {
    const fallback = rawValue.split('/').filter(Boolean).pop()
    return decodeURIComponent(fallback || rawValue)
  }
}

export function CollapsibleAssetField({
  label,
  value,
  onChange,
  disabled = false,
}: CollapsibleAssetFieldProps) {
  const [expanded, setExpanded] = useState(!value && !disabled)
  const assetLabel = useMemo(() => getAssetLabel(value), [value])
  const isExpanded = disabled ? false : expanded

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {!disabled && value && !isExpanded ? (
          <Button type="button" size="sm" variant="outline" onClick={() => setExpanded(true)}>
            Replace
          </Button>
        ) : null}
      </div>

      {value && !isExpanded ? (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-md border border-border/70 bg-muted/40">
              <img
                src={resolveAssetImageUrl(value, { width: 140, height: 140, fit: 'cover' })}
                alt={`${label} preview`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{assetLabel}</p>
              <p className="text-xs text-muted-foreground">Selected image</p>
            </div>
            {!disabled ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  onChange('')
                  setExpanded(true)
                }}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      ) : disabled ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
          No image set
        </div>
      ) : (
        <AssetPickerField
          value={value}
          onChange={(nextValue) => {
            onChange(nextValue)
            setExpanded(!nextValue)
          }}
          accept="image/*"
        />
      )}
    </div>
  )
}
