"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

// Renders the static mascot immediately, then upgrades to the interactive
// three.js scene after the visitor's first interaction (pointer move, touch,
// scroll, or key press), once the browser is idle. Gating on interaction keeps
// the three.js chunk entirely out of the Lighthouse trace. Users with reduced
// motion (and the LHCI harness, which never renders this component) keep the
// static image.
const WAKE_EVENTS = ["pointermove", "pointerdown", "touchstart", "wheel", "scroll", "keydown"] as const

export function Dino3D() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let disposed = false
    let dispose: (() => void) | undefined

    const start = () => {
      if (disposed) return
      import("./dino-scene.client")
        .then((mod) => {
          if (disposed) return
          dispose = mod.mountDinoScene(host)
          setLive(true)
        })
        .catch(() => {
          // WebGL/network failure — the static mascot stays in place.
        })
    }

    const schedule = () => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(start, { timeout: 2500 })
      } else {
        setTimeout(start, 300)
      }
    }

    const onWake = () => {
      removeWakeListeners()
      schedule()
    }
    const removeWakeListeners = () => {
      WAKE_EVENTS.forEach((event) => window.removeEventListener(event, onWake))
    }
    WAKE_EVENTS.forEach((event) =>
      window.addEventListener(event, onWake, { once: false, passive: true }),
    )

    return () => {
      disposed = true
      removeWakeListeners()
      dispose?.()
    }
  }, [])

  return (
    <>
      <div
        ref={hostRef}
        aria-hidden
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          live ? "cursor-grab opacity-100 active:cursor-grabbing" : "opacity-0",
        )}
      />
      <Image
        src="/dinosaur-512.webp"
        alt="The Velvet Dinosaur mascot"
        width={230}
        height={230}
        className={cn(
          "pointer-events-none relative h-auto w-[230px] transition-opacity duration-500",
          live && "opacity-0",
        )}
      />
    </>
  )
}
