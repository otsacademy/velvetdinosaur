"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface TimelineCenteredSpineItem {
  id: string
  phase: string
  window: string
  category: string
  title: string
  description: string
  details: string
  proof?: string
}

interface TimelineCenteredSpineProps {
  className?: string
  heading: string
  summary: string
  rangeLabel: string
  items: TimelineCenteredSpineItem[]
}

export function TimelineCenteredSpine({
  className,
  heading,
  summary,
  rangeLabel,
  items,
}: TimelineCenteredSpineProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (items.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-[1.5rem] border border-border bg-card/90 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border/80 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{heading}</h3>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{summary}</p>
        </div>
        <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-[0.7rem] uppercase tracking-[0.16em]">
          {rangeLabel}
        </Badge>
      </div>

      <div className="relative px-5 py-6 sm:px-6 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute bottom-6 left-[1.125rem] top-6 w-px bg-[color-mix(in_oklch,var(--vd-primary)_18%,var(--vd-border))] md:left-1/2 md:w-[3px] md:-translate-x-1/2 md:rounded-full"
        />
        <ol>
          {items.map((item, index) => {
            const isLeft = index % 2 === 0
            const isExpanded = expanded === item.id

            return (
              <li
                key={item.id}
                className={cn(
                  "relative pl-9",
                  index < items.length - 1 ? "pb-5 md:pb-6" : "",
                  "md:pl-0",
                )}
              >
                <div
                  aria-hidden="true"
                  className="absolute left-[1.125rem] top-6 z-10 size-3 -translate-x-1/2 rotate-45 border border-[color-mix(in_oklch,var(--vd-primary)_24%,var(--vd-border))] bg-background md:left-1/2"
                />

                <div className="md:grid md:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)]">
                  <div className={cn(isLeft ? "md:col-start-1" : "md:col-start-3")}>
                    <article className="rounded-[1.25rem] border border-border/80 bg-background/95 p-5 shadow-sm">
                      <div
                        className={cn(
                          "flex flex-wrap items-center gap-2",
                          isLeft && "md:justify-end md:text-right",
                        )}
                      >
                        <Badge variant="secondary" className="rounded-full px-3 py-1 text-[0.7rem]">
                          {item.category}
                        </Badge>
                        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-foreground/85">
                          {item.phase}
                        </span>
                        <span className="text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground">
                          {item.window}
                        </span>
                      </div>

                      <div className={cn("mt-4 space-y-3", isLeft && "md:text-right")}>
                        <h4 className="text-lg font-semibold tracking-tight text-foreground">{item.title}</h4>
                        <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                        {item.proof ? (
                          <p className="text-sm font-medium text-[var(--vd-dino-blue)]">{item.proof}</p>
                        ) : null}
                      </div>

                      <div className={cn("mt-4", isLeft && "md:flex md:justify-end")}>
                        <button
                          type="button"
                          onClick={() => setExpanded(isExpanded ? null : item.id)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          More detail
                          <ChevronRight
                            className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-90")}
                          />
                        </button>
                      </div>

                      {isExpanded ? (
                        <div className="mt-4 rounded-xl bg-[color-mix(in_oklch,var(--vd-primary)_6%,var(--vd-bg))] p-4">
                          <p
                            className={cn(
                              "text-sm leading-relaxed text-[var(--vd-copy)]",
                              isLeft && "md:text-right",
                            )}
                          >
                            {item.details}
                          </p>
                        </div>
                      ) : null}
                    </article>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
