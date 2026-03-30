"use client"

import { useState } from "react"
import { ChevronRight, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
    <div className={cn("w-full py-12", className)}>
      <div className="mb-12 flex flex-col gap-4 md:items-center md:text-center">
        <Badge 
          variant="outline" 
          className="w-fit rounded-full border-primary/20 bg-primary/5 px-4 py-1 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-primary"
        >
          {rangeLabel}
        </Badge>
        <h3 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{heading}</h3>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground">{summary}</p>
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-6 top-0 w-px bg-gradient-to-b from-transparent via-[color-mix(in_oklch,var(--vd-primary)_25%,var(--vd-border))] to-transparent md:left-1/2 md:w-[2px] md:-translate-x-1/2"
        />
        
        <ol className="relative space-y-12">
          {items.map((item, index) => {
            const isLeft = index % 2 === 0
            const isExpanded = expanded === item.id

            return (
              <li
                key={item.id}
                className={cn(
                  "relative pl-10 md:pl-0",
                  "flex flex-col md:grid md:grid-cols-2 md:gap-24"
                )}
              >
                <div
                  aria-hidden="true"
                  className="absolute left-6 top-8 z-10 size-3 -translate-x-1/2 rotate-45 border-2 border-primary bg-background md:left-1/2"
                />

                <div className={cn(
                  "relative",
                  isLeft ? "md:text-right" : "md:col-start-2"
                )}>
                  <motion.article 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={cn(
                      "group relative rounded-3xl border border-border/50 bg-background/40 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 shadow-sm",
                      isExpanded && "border-primary/20 ring-1 ring-primary/10"
                    )}
                  >
                    <div
                      className={cn(
                        "flex flex-wrap items-center gap-3 mb-4",
                        isLeft && "md:justify-end"
                      )}
                    >
                      <span className="text-[0.75rem] font-black uppercase tracking-widest text-primary/80">
                        PHASE {item.phase}
                      </span>
                      <div className="h-1 w-1 rounded-full bg-border" />
                      <span className="text-[0.75rem] font-medium text-muted-foreground">
                        {item.window}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                      
                      {item.proof ? (
                        <div className={cn(
                          "flex items-center gap-2 pt-1",
                          isLeft && "md:justify-end"
                        )}>
                          <Sparkles className="size-3.5 text-primary" />
                          <span className="text-sm font-semibold text-primary">{item.proof}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className={cn("mt-6", isLeft && "md:flex md:justify-end")}>
                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : item.id)}
                        className="inline-flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2 text-sm font-semibold text-foreground transition-all hover:bg-primary hover:text-primary-foreground shadow-sm"
                      >
                        {isExpanded ? "Show less" : "View breakdown"}
                        <ChevronRight
                          className={cn("h-4 w-4 transition-transform duration-300", isExpanded && "rotate-90")}
                        />
                      </button>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-6 border-t border-border/50 pt-6">
                            <p className="text-[0.9375rem] leading-relaxed text-muted-foreground italic">
                              &ldquo;{item.details}&rdquo;
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
