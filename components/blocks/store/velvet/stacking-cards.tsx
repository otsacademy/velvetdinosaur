"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { EditableText } from "@/components/content/editable"
import { contentKey } from "@/components/content/content-keys"
import { PortfolioDeck } from "@/components/blocks/store/velvet/shared/portfolio-deck"
import { cn } from "@/lib/utils"

const STACK_SCALE_RANGE = 0.06
const STACK_TRANSLATE_RANGE = 12
const STACK_OPACITY_RANGE = 0.02
const NAV_HEIGHT_FALLBACK = 72
const NAV_OFFSET_PADDING = 24
const DESKTOP_MEDIA_QUERY = "(min-width: 769px)"

type StackMetric = {
  label: string
  value: string
}

type StringItem = string | { value?: string }

type StackCard = {
  eyebrow: string
  title: string
  description?: string
  problem: string
  build: string
  result: string
  metrics?: StackMetric[]
  cta?: { label: string; href: string }
  images?: StringItem[]
  icon?: string
}

type DetailLabels = {
  problem: string
  build: string
  result: string
}

export type StackingCardsProps = {
  id?: string
  heading: string
  subheading: string
  cards: StackCard[]
  detailLabels: DetailLabels
  ctaTooltipLabel: string
  portfolioStackLabel: string
  portfolioMagazineLabel: string
  portfolioStackAriaLabel: string
  portfolioMagazineAriaLabel: string
}

const iconMap: Record<string, React.ReactNode> = {
  education: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </svg>
  ),
  tours: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="m18 14-1-3" />
      <path d="m3 9 6 2a2 2 0 0 1 2-2h2a2 2 0 0 1 1.99 1.81" />
      <path d="M8 17h3a1 1 0 0 0 1-1 6 6 0 0 1 6-6 1 1 0 0 0 1-1v-.75A5 5 0 0 0 17 5" />
      <circle cx="19" cy="17" r="3" />
      <circle cx="5" cy="17" r="3" />
    </svg>
  ),
  personal: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M10 10h4" />
      <path d="M19 7V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3" />
      <path d="M20 21a2 2 0 0 0 2-2v-3.851c0-1.39-2-2.962-2-4.829V8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2z" />
      <path d="M 22 16 L 2 16" />
      <path d="M4 21a2 2 0 0 1-2-2v-3.851c0-1.39 2-2.962 2-4.829V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2z" />
      <path d="M9 7V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3" />
    </svg>
  ),
  journal: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" />
      <path d="M2 6h4" />
      <path d="M2 10h4" />
      <path d="M2 14h4" />
      <path d="M2 18h4" />
      <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
    </svg>
  ),
}

const defaultIconKeys = ["education", "tours", "personal", "journal"]

function formatLabel(template: string, title: string) {
  if (!template) return ""
  return template.replace("{title}", title)
}

function getNavOffset() {
  if (typeof window === "undefined") return NAV_HEIGHT_FALLBACK + NAV_OFFSET_PADDING
  const navVar = getComputedStyle(document.documentElement).getPropertyValue("--nav-h").trim()
  const navHeight = Number.parseFloat(navVar || "")
  const resolved = Number.isFinite(navHeight) ? navHeight : NAV_HEIGHT_FALLBACK
  return resolved + NAV_OFFSET_PADDING
}

export function StackingCardsSection(props: StackingCardsProps) {
  const key = (path: string) => contentKey(props.id, path)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<Array<HTMLDivElement | null>>([])
  const wrapperRefs = useRef<Array<HTMLDivElement | null>>([])
  const [stackEnabled, setStackEnabled] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const cards = (props.cards || []).map((card, index) => {
    const iconKey = card.icon || defaultIconKeys[index]
    return { ...card, icon: iconMap[iconKey] }
  })

  const clampStyle: React.CSSProperties = {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const desktopQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)

    const update = () => {
      setPrefersReducedMotion(reducedMotion.matches)
      setStackEnabled(desktopQuery.matches && !reducedMotion.matches)
    }

    update()
    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener("change", update)
      desktopQuery.addEventListener("change", update)
    } else {
      reducedMotion.addListener(update)
      desktopQuery.addListener(update)
    }

    return () => {
      if (reducedMotion.removeEventListener) {
        reducedMotion.removeEventListener("change", update)
        desktopQuery.removeEventListener("change", update)
      } else {
        reducedMotion.removeListener(update)
        desktopQuery.removeListener(update)
      }
    }
  }, [])

  useEffect(() => {
    const cardsList = cardRefs.current.filter(Boolean) as HTMLDivElement[]
    if (!cardsList.length) return

    const setStatic = () => {
      cardsList.forEach((card) => {
        card.style.setProperty("--stack-scale", "1")
        card.style.setProperty("--stack-y", "0px")
        card.style.setProperty("--stack-opacity", "1")
      })
    }

    setStatic()

    if (!stackEnabled) return

    let rafId = 0
    let isActive = false

    const update = () => {
      const container = containerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const scrollY = window.scrollY
      const start = containerRect.top + scrollY - getNavOffset()
      const end = containerRect.bottom + scrollY - window.innerHeight
      const total = Math.max(end - start, 1)
      const progress = Math.min(Math.max((scrollY - start) / total, 0), 1)

      const steps = Math.max(cardsList.length - 1, 1)
      const segment = 1 / steps

      cardsList.forEach((card, index) => {
        if (index >= steps) {
          card.style.setProperty("--stack-scale", "1")
          card.style.setProperty("--stack-y", "0px")
          card.style.setProperty("--stack-opacity", "1")
          return
        }

        const local = Math.min(Math.max((progress - index * segment) / segment, 0), 1)
        const scale = 1 - local * STACK_SCALE_RANGE
        const translateY = local * STACK_TRANSLATE_RANGE
        const opacity = 1 - local * STACK_OPACITY_RANGE

        card.style.setProperty("--stack-scale", scale.toFixed(3))
        card.style.setProperty("--stack-y", `${translateY.toFixed(2)}px`)
        card.style.setProperty("--stack-opacity", opacity.toFixed(3))
      })
    }

    const onScroll = () => {
      if (!isActive) return
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        update()
      })
    }

    const observer = new IntersectionObserver(
      (entries) => {
        isActive = entries[0]?.isIntersecting ?? false
        if (isActive) update()
      },
      { threshold: 0 },
    )

    if (containerRef.current) observer.observe(containerRef.current)

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    update()

    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [stackEnabled])

  useEffect(() => {
    const elements = wrapperRefs.current.filter(Boolean) as HTMLDivElement[]
    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (!visible.length) return
        visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const nextIndex = elements.indexOf(visible[0].target as HTMLDivElement)
        if (nextIndex >= 0) setActiveIndex(nextIndex)
      },
      {
        threshold: [0.2, 0.4, 0.6, 0.8],
        rootMargin: "-10% 0px -40% 0px",
      },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="portfolio" className="bg-background pt-16 pb-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-10">
          <div className="flex items-center justify-center gap-3 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground"
              aria-hidden
            >
              <path d="M3 2v1c0 1 2 1 2 2S3 6 3 7s2 1 2 2-2 1-2 2 2 1 2 2" />
              <path d="M18 6h.01" />
              <path d="M6 18h.01" />
              <path d="M20.83 8.83a4 4 0 0 0-5.66-5.66l-12 12a4 4 0 1 0 5.66 5.66Z" />
              <path d="M18 11.66V22a4 4 0 0 0 4-4V6" />
            </svg>
            <h2 className="text-3xl font-semibold tracking-tight">
              <EditableText contentKey={key("caseStudies.heading")} value={props.heading} as="span" showIcon={false} />
            </h2>
          </div>
          <p className="mt-3 text-muted-foreground text-left">
            <EditableText
              contentKey={key("caseStudies.subheading")}
              value={props.subheading}
              as="span"
              multiline
              showIcon={false}
            />
          </p>
        </header>
        <div ref={containerRef} className="relative pb-[9.6vh] md:pb-[8vh]">
          <div className="space-y-6 md:space-y-8">
            {cards.map((card, index) => {
              const tooltipLabel = formatLabel(props.ctaTooltipLabel, card.title)

              return (
                <div
                  key={card.title}
                  className={`sticky ${stackEnabled ? "" : "static"}`}
                  style={{
                    top: "calc(var(--nav-h, 72px) + 24px)",
                    zIndex: index + 1,
                  }}
                  ref={(el) => {
                    wrapperRefs.current[index] = el
                  }}
                >
                  <div
                    ref={(el) => {
                      cardRefs.current[index] = el
                    }}
                    className="rounded-2xl border bg-background p-6 shadow-sm transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none"
                    style={
                      stackEnabled && !prefersReducedMotion
                        ? {
                            transform: "translate3d(0,var(--stack-y,0px),0) scale(var(--stack-scale,1))",
                            opacity: "var(--stack-opacity,1)",
                          }
                        : { transform: "none", opacity: 1 }
                    }
                  >
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={cn(
                        "flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em]",
                        index === activeIndex ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {card.icon ? (
                        <span className={cn("shrink-0", index === activeIndex ? "text-primary" : "text-muted-foreground")}>
                          {card.icon}
                        </span>
                      ) : null}
                      <EditableText
                        contentKey={key(`caseStudies.cards.${index}.eyebrow`)}
                        value={card.eyebrow}
                        as="span"
                        showIcon={false}
                      />
                    </span>
                    {card.cta ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={card.cta.href}
                              aria-label={`Open ${card.title}`}
                              className={cn(
                                "rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border/60",
                                index === activeIndex ? "text-primary" : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                                aria-hidden
                              >
                                <path d="M15 3h6v6" />
                                <path d="M10 14 21 3" />
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              </svg>
                            </Link>
                          </TooltipTrigger>
                          {tooltipLabel ? <TooltipContent>{tooltipLabel}</TooltipContent> : null}
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                  </div>
                  <h3
                    className={cn(
                      "mt-4 text-xl font-semibold",
                      index === activeIndex ? "text-primary" : "text-card-foreground",
                    )}
                  >
                    <EditableText
                      contentKey={key(`caseStudies.cards.${index}.title`)}
                      value={card.title}
                      as="span"
                      showIcon={false}
                    />
                  </h3>
                  <div className="mt-3 h-px w-12 bg-gradient-to-r from-primary/60 to-transparent" aria-hidden />
                  {card.description ? (
                    <p className="mt-3 text-sm text-muted-foreground md:text-base">
                      <EditableText
                        contentKey={key(`caseStudies.cards.${index}.description`)}
                        value={card.description}
                        as="span"
                        multiline
                        showIcon={false}
                      />
                    </p>
                  ) : null}
                  <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:gap-2">
                    {[
                      { label: props.detailLabels?.problem, path: "problem" },
                      { label: props.detailLabels?.build, path: "build" },
                      { label: props.detailLabels?.result, path: "result" },
                    ].map((item) => (
                      <div key={item.path} className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                          {item.label}
                        </span>
                        <span className="text-foreground/85" style={clampStyle}>
                          <EditableText
                            contentKey={key(`caseStudies.cards.${index}.${item.path}`)}
                            value={(card as any)[item.path]}
                            as="span"
                            multiline
                            showIcon={false}
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                  {card.metrics?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {card.metrics.slice(0, 3).map((metric, metricIndex) => (
                        <Badge key={`${metric.label}-${metricIndex}`} variant="secondary" className="gap-2 text-xs">
                          <span className="uppercase tracking-[0.18em] text-muted-foreground">
                            <EditableText
                              contentKey={key(`caseStudies.cards.${index}.metrics.${metricIndex}.label`)}
                              value={metric.label}
                              as="span"
                              showIcon={false}
                            />
                          </span>
                          <span className="text-foreground">
                            <EditableText
                              contentKey={key(`caseStudies.cards.${index}.metrics.${metricIndex}.value`)}
                              value={metric.value}
                              as="span"
                              showIcon={false}
                            />
                          </span>
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {card.images?.length ? (
                    <div className="mt-6 flex justify-center">
                      <PortfolioDeck
                        images={(card.images || [])
                          .map((item) => (typeof item === "string" ? item : item?.value))
                          .filter((item): item is string => Boolean(item))}
                        title={card.title}
                        layout="magazine"
                        stackLabel={props.portfolioStackLabel}
                        magazineLabel={props.portfolioMagazineLabel}
                        stackAriaLabel={props.portfolioStackAriaLabel}
                        magazineAriaLabel={props.portfolioMagazineAriaLabel}
                      />
                    </div>
                  ) : null}
                  {card.cta ? (
                    <div className="mt-5">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={card.cta.href}>
                          <EditableText
                            contentKey={key(`caseStudies.cards.${index}.cta.label`)}
                            value={card.cta.label}
                            as="span"
                            showIcon={false}
                          />
                        </Link>
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
              )
            })}
          </div>
        </div>
      </div>
      <div id="portfolio-cta-trigger" aria-hidden className="h-1" />
    </section>
  )
}
