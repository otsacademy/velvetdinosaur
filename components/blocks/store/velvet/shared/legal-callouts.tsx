"use client"

import { EditableText } from "@/components/content/editable"
import { normalizeStringItems, type StringItem } from "@/components/blocks/store/velvet/shared/legal-helpers"

type LegalCalloutLink = {
  prefix?: string
  label: string
  href: string
}

export type LegalCallout = {
  title?: string
  lines: StringItem[]
  link?: LegalCalloutLink
}

type LegalCalloutsProps = {
  callouts: LegalCallout[]
  sectionId: string
  keyPrefix: (path: string) => string
}

export function LegalCallouts({ callouts, sectionId, keyPrefix }: LegalCalloutsProps) {
  if (!callouts.length) return null
  const key = (path: string) => keyPrefix(`legal.sections.${sectionId}.${path}`)

  return (
    <div className="space-y-3">
      {callouts.map((callout, calloutIndex) => {
        const lines = normalizeStringItems(callout.lines)
        return (
          <div key={calloutIndex} className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            {callout.title ? (
              <p className="font-medium text-foreground">
                <EditableText
                  contentKey={key(`callouts.${calloutIndex}.title`)}
                  value={callout.title}
                  as="span"
                  showIcon={false}
                />
              </p>
            ) : null}
            {lines.map((line, lineIndex) => (
              <p key={lineIndex}>
                <EditableText
                  contentKey={key(`callouts.${calloutIndex}.lines.${lineIndex}`)}
                  value={line}
                  as="span"
                  showIcon={false}
                />
              </p>
            ))}
            {callout.link ? (
              <p>
                {callout.link.prefix ? (
                  <EditableText
                    contentKey={key(`callouts.${calloutIndex}.link.prefix`)}
                    value={callout.link.prefix}
                    as="span"
                    showIcon={false}
                  />
                ) : null}
                <a href={callout.link.href} className="underline underline-offset-4">
                  <EditableText
                    contentKey={key(`callouts.${calloutIndex}.link.label`)}
                    value={callout.link.label}
                    as="span"
                    showIcon={false}
                  />
                </a>
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
