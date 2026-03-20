"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { ComponentConfig } from "@measured/puck"

import { Button } from "@/components/ui/button"
import { EditableText } from "@/components/content/editable"
import { contentKey } from "@/components/content/content-keys"

const STORAGE_KEY = "vd-sticky-cta-dismissed"

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

type CtaLink = {
  label: string
  href: string
}

export type StickyCtaProps = {
  id?: string
  triggerId?: string
  enabled?: "true" | "false"
  message: string
  primaryCta: CtaLink
  secondaryCta: CtaLink
  dismissLabel: string
}

export function StickyCta(props: StickyCtaProps) {
  const key = (path: string) => contentKey(props.id, path)
  const triggerId = props.triggerId || "portfolio-cta-trigger"
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") return false
    try {
      return window.localStorage.getItem(STORAGE_KEY) === getTodayKey()
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    if (isDismissed) return

    const sentinel = document.getElementById(triggerId)
    if (!sentinel) return

    let rafId = 0
    const update = () => {
      const rect = sentinel.getBoundingClientRect()
      const offset = window.innerHeight * 0.15
      const hasPassed = rect.top < -offset

      const booking = document.getElementById("booking")
      const bookingRect = booking?.getBoundingClientRect()
      const bookingInView = bookingRect
        ? bookingRect.top < window.innerHeight && bookingRect.bottom > 0
        : false

      setIsVisible(hasPassed && !bookingInView)
    }

    const onScroll = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        update()
      })
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [triggerId, isDismissed])

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, getTodayKey())
    }
    setIsDismissed(true)
  }

  const isEnabled = props.enabled !== "false"
  const message = props.message || ""

  if (!isEnabled || !message || isDismissed || !isVisible) return null

  return (
    <div className="fixed inset-x-0 bottom-3 z-40 px-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl border border-border/60 bg-background/95 px-4 py-2 shadow-md backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-foreground">
          <EditableText contentKey={key("stickyCta.message")} value={props.message} as="span" showIcon={false} />
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" className="rounded-full">
            <Link href={props.primaryCta?.href || "#booking"}>
              <EditableText
                contentKey={key("stickyCta.primaryCta.label")}
                value={props.primaryCta?.label || ""}
                as="span"
                showIcon={false}
              />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href={props.secondaryCta?.href || "#pricing"}>
              <EditableText
                contentKey={key("stickyCta.secondaryCta.label")}
                value={props.secondaryCta?.label || ""}
                as="span"
                showIcon={false}
              />
            </Link>
          </Button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={props.dismissLabel}
          >
            <EditableText contentKey={key("stickyCta.dismissLabel")} value={props.dismissLabel} as="span" showIcon={false} />
          </button>
        </div>
      </div>
    </div>
  )
}

export const stickyCtaConfig: ComponentConfig<StickyCtaProps> = {
  fields: {
    triggerId: { type: "text" },
    enabled: {
      type: "select",
      options: [
        { label: "Show", value: "true" },
        { label: "Hide", value: "false" },
      ],
    },
    message: { type: "text" },
    primaryCta: {
      type: "object",
      objectFields: {
        label: { type: "text" },
        href: { type: "text" },
      },
    },
    secondaryCta: {
      type: "object",
      objectFields: {
        label: { type: "text" },
        href: { type: "text" },
      },
    },
    dismissLabel: { type: "text" },
  },
  defaultProps: {
    triggerId: "portfolio-cta-trigger",
    enabled: "true",
    message: "",
    primaryCta: { label: "", href: "" },
    secondaryCta: { label: "", href: "" },
    dismissLabel: "",
  },
  render: (props) => <StickyCta {...props} />,
}
