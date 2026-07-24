"use client"

import { useEffect, useRef, useState } from "react"

import { ScoreCells } from "./home-shared"

// Lighthouse score strip — counts 0 → 100 when scrolled into view. Server
// render (and reduced-motion users) show the final value so there is no
// layout or content flash without JavaScript.
export function ScoresStrip() {
  const ref = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState(100)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (!("IntersectionObserver" in window)) return

    let frame = 0
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        const t0 = performance.now()
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / 1400)
          setValue(Math.round((1 - Math.pow(1 - p, 3)) * 100))
          if (p < 1) frame = requestAnimationFrame(tick)
        }
        setValue(0)
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={ref} className="grid grid-cols-2 gap-px md:grid-cols-4">
      <ScoreCells value={value} />
    </div>
  )
}
