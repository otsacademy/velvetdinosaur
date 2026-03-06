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
    const timer = window.setTimeout(() => setVisible(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className={cn(
        "fixed bottom-4 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary text-primary-foreground shadow-[0_16px_28px_-18px_color-mix(in_oklch,oklch(var(--vd-primary))_70%,transparent)] transition-all duration-500 md:bottom-6 md:right-6",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      )}
    >
      <MessageCircle className="h-5 w-5" />
      <span className="sr-only">Open WhatsApp chat</span>
    </a>
  )
}
