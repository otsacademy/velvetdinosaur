"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { cn } from "@/lib/utils"
import { buildCdnImageUrl } from "@/lib/uploads"

const deckTransforms = [
  "rotate-[0deg] translate-y-[0px] scale-[1]",
  "rotate-[-6deg] -translate-x-[28px] translate-y-[14px] md:-translate-x-[34px] md:translate-y-[18px] scale-[0.985]",
  "rotate-[6deg] translate-x-[28px] translate-y-[14px] md:translate-x-[34px] md:translate-y-[18px] scale-[0.985]",
  "rotate-[-3deg] -translate-x-[20px] translate-y-[28px] md:-translate-x-[26px] md:translate-y-[34px] scale-[0.97]",
  "rotate-[3deg] translate-x-[20px] translate-y-[28px] md:translate-x-[26px] md:translate-y-[34px] scale-[0.97]",
]

const deckOpacities = [1, 0.5, 0.4, 0.3, 0.22]

type PortfolioDeckProps = {
  images: string[]
  title: string
  layout?: "stack" | "magazine"
  stackLabel?: string
  magazineLabel?: string
  stackAriaLabel?: string
  magazineAriaLabel?: string
}

function formatLabel(template: string | undefined, title: string) {
  if (!template) return ""
  return template.replace("{title}", title)
}

export function PortfolioDeck({
  images,
  title,
  layout = "stack",
  stackLabel,
  magazineLabel,
  stackAriaLabel,
  magazineAriaLabel,
}: PortfolioDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const flipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const orderedImages = useMemo(() => {
    if (!images.length) return []
    const start = activeIndex % images.length
    return images.slice(start).concat(images.slice(0, start))
  }, [activeIndex, images])

  const displayImages = orderedImages.slice(0, deckTransforms.length)

  const advance = useCallback(() => {
    const step = layout === "magazine" ? 2 : 1
    if (layout === "magazine") {
      setIsFlipping(true)
      if (flipTimeout.current) clearTimeout(flipTimeout.current)
      if (resetTimeout.current) clearTimeout(resetTimeout.current)
      flipTimeout.current = setTimeout(() => {
        setActiveIndex((index) => (images.length ? (index + step) % images.length : 0))
      }, 160)
      resetTimeout.current = setTimeout(() => setIsFlipping(false), 320)
      return
    }

    setActiveIndex((index) => (images.length ? (index + step) % images.length : 0))
  }, [images.length, layout])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        advance()
      }
    },
    [advance],
  )

  useEffect(() => {
    return () => {
      if (flipTimeout.current) clearTimeout(flipTimeout.current)
      if (resetTimeout.current) clearTimeout(resetTimeout.current)
    }
  }, [])

  if (layout === "magazine") {
    const leftImage = orderedImages[0]
    const rightImage = orderedImages[1] ?? orderedImages[0]
    const resolvedAria = formatLabel(magazineAriaLabel, title)

    return (
      <button
        type="button"
        onClick={advance}
        onKeyDown={handleKeyDown}
        className="group relative mx-auto w-full max-w-[72rem] cursor-pointer overflow-visible rounded-2xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={resolvedAria || undefined}
      >
        <div
          className="relative mx-auto w-full max-w-[72rem] aspect-[16/10] sm:aspect-[16/9] lg:aspect-[3/2]"
          style={{ perspective: "1200px" }}
        >
          <div
            className="absolute inset-0 transition-transform duration-300 motion-reduce:transition-none"
            style={{
              transform: isFlipping ? "rotateY(-8deg)" : "rotateY(0deg)",
              transformStyle: "preserve-3d",
            }}
          >
            <div className="absolute left-1/2 top-2 h-[calc(100%-1rem)] w-px -translate-x-1/2 bg-border/60" />
            <div className="absolute left-1/2 top-0 h-full w-[46%] -translate-x-[104%] rounded-2xl border border-border/60 bg-background/60 shadow-sm transition-transform duration-300 motion-reduce:transition-none md:-translate-x-[106%]">
              {leftImage ? (
                <div className="relative h-full w-full">
                  <img
                    src={buildCdnImageUrl(leftImage, { width: 1400, height: 900, fit: "cover" })}
                    alt={`${title} magazine preview left`}
                    draggable={false}
                    className="absolute inset-0 h-full w-full rounded-2xl object-cover"
                  />
                </div>
              ) : null}
            </div>
            <div className="absolute left-1/2 top-0 h-full w-[46%] translate-x-[4%] rounded-2xl border border-border/60 bg-background/60 shadow-sm transition-transform duration-300 motion-reduce:transition-none md:translate-x-[6%]">
              {rightImage ? (
                <div className="relative h-full w-full">
                  <img
                    src={buildCdnImageUrl(rightImage, { width: 1400, height: 900, fit: "cover" })}
                    alt={`${title} magazine preview right`}
                    draggable={false}
                    className="absolute inset-0 h-full w-full rounded-2xl object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {magazineLabel ? (
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
            {magazineLabel}
          </span>
        ) : null}
      </button>
    )
  }

  const resolvedAria = formatLabel(stackAriaLabel, title)

  return (
    <button
      type="button"
      onClick={advance}
      onKeyDown={handleKeyDown}
      className="group relative z-10 h-[30rem] w-full max-w-[28rem] sm:h-[34rem] sm:max-w-[30rem] lg:h-[38rem] lg:max-w-[34rem] mx-auto cursor-pointer overflow-visible rounded-2xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={resolvedAria || undefined}
    >
      {displayImages.map((src, index) => (
        <span
          key={src}
          className={cn(
            "absolute inset-0 origin-bottom overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm transition-transform duration-300",
            deckTransforms[index],
          )}
          style={{ zIndex: displayImages.length - index, opacity: deckOpacities[index] ?? 1 }}
        >
          <div className="relative h-full w-full">
            <img
              src={buildCdnImageUrl(src, { width: 1200, height: 1600, fit: "cover" })}
              alt={`${title} preview ${index + 1}`}
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </span>
      ))}
      {stackLabel ? (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
          {stackLabel}
        </span>
      ) : null}
    </button>
  )
}
