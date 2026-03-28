"use client"

import { MessageCircle } from "lucide-react"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

type FloatingWhatsAppProps = {
  href: string
  delayMs?: number
}

export function FloatingWhatsApp({ href, delayMs = 1400 }: FloatingWhatsAppProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isAutomatedBrowser = navigator.webdriver

    if (prefersReducedMotion || isAutomatedBrowser) {
      setVisible(true)
      return
    }

    const timer = window.setTimeout(() => setVisible(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  if (!href) return null

  return (
    <div
      data-floating-whatsapp
      className={cn(
        "vd-whatsapp-dock fixed z-40 flex items-center gap-3 transition-all duration-500",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      )}
    >
      <span
        aria-hidden="true"
        className="animate-vd-whatsapp-bubble vd-whatsapp-bubble pointer-events-none inline-flex whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium"
      >
        Chat with me
      </span>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        data-analytics-event="whatsapp_click"
        data-analytics-category="contact"
        data-analytics-label="Floating WhatsApp"
        data-analytics-section="floating_whatsapp"
        className="vd-hover-lift-sm inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--vd-primary)_24%,var(--vd-border))] bg-[var(--vd-primary-solid)] text-[var(--vd-primary-fg)] shadow-[0_16px_28px_-18px_color-mix(in_oklch,var(--vd-primary)_54%,transparent)] transition-all duration-300 hover:bg-[var(--vd-primary-solid-hover)]"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="sr-only">Open WhatsApp chat</span>
      </a>
    </div>
  )
}
