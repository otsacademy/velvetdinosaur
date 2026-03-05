/* eslint-disable @next/next/no-img-element -- pixel reveal effect relies on clipped layered image elements */
"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

interface Grid {
  rows: number
  cols: number
}

const DEFAULT_GRIDS: Record<string, Grid> = {
  "6x4": { rows: 4, cols: 6 },
  "8x8": { rows: 8, cols: 8 },
  "8x3": { rows: 3, cols: 8 },
  "4x6": { rows: 6, cols: 4 },
  "3x8": { rows: 8, cols: 3 },
}

type PredefinedGridKey = keyof typeof DEFAULT_GRIDS

interface PixelImageProps {
  src: string
  alt?: string
  grid?: PredefinedGridKey
  customGrid?: Grid
  grayscaleAnimation?: boolean
  pixelFadeInDuration?: number // ms
  maxAnimationDelay?: number // ms
  colorRevealDelay?: number // ms
  showReplayButton?: boolean
  overlayText?: string
  sizeClassName?: string
  className?: string
}

export const PixelImage = ({
  src,
  alt,
  grid = "6x4",
  grayscaleAnimation = true,
  pixelFadeInDuration = 1000,
  maxAnimationDelay = 1200,
  colorRevealDelay = 1300,
  customGrid,
  showReplayButton = false,
  overlayText,
  sizeClassName,
  className,
}: PixelImageProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showColor, setShowColor] = useState(false)
  const [key, setKey] = useState(0)

  const MIN_GRID = 1
  const MAX_GRID = 16

  const { rows, cols } = useMemo(() => {
    const isValidGrid = (grid?: Grid) => {
      if (!grid) return false
      const { rows, cols } = grid
      return (
        Number.isInteger(rows) &&
        Number.isInteger(cols) &&
        rows >= MIN_GRID &&
        cols >= MIN_GRID &&
        rows <= MAX_GRID &&
        cols <= MAX_GRID
      )
    }

    return isValidGrid(customGrid) ? customGrid! : DEFAULT_GRIDS[grid]
  }, [customGrid, grid])

  const resetAnimation = () => {
    setIsVisible(false)
    setShowColor(false)
    setKey((prev) => prev + 1)
  }

  useEffect(() => {
    const startTimeout = setTimeout(() => setIsVisible(true), 50)
    const colorTimeout = setTimeout(() => setShowColor(true), colorRevealDelay + 50)
    return () => {
      clearTimeout(startTimeout)
      clearTimeout(colorTimeout)
    }
  }, [colorRevealDelay, key])

  const pieces = useMemo(() => {
    const total = rows * cols
    return Array.from({ length: total }, (_, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols

      const clipPath = `polygon(\n        ${col * (100 / cols)}% ${row * (100 / rows)}%,\n        ${(col + 1) * (100 / cols)}% ${row * (100 / rows)}%,\n        ${(col + 1) * (100 / cols)}% ${(row + 1) * (100 / rows)}%,\n        ${col * (100 / cols)}% ${(row + 1) * (100 / rows)}%\n      )`

      // Deterministic delays to avoid hydration mismatch.
      const delay = ((index * 23) % total) * (maxAnimationDelay / total)
      return { clipPath, delay }
    })
  }, [rows, cols, maxAnimationDelay])

  return (
    <div className={cn("relative", className)} role={alt ? "img" : undefined} aria-label={alt}>
      {/* 2x the original demo sizing: 288px -> 576px, 384px -> 768px */}
      <div
        className={cn(
          "relative h-[min(36rem,92vw)] w-[min(36rem,92vw)] select-none md:h-[min(48rem,70vw)] md:w-[min(48rem,70vw)]",
          sizeClassName,
        )}
        key={key}
      >
        {pieces.map((piece, index) => (
          <div
            className={cn(
              "absolute inset-0 transition-all ease-out",
              isVisible ? "opacity-100" : "opacity-0",
            )}
            key={index}
            style={{
              clipPath: piece.clipPath,
              transitionDelay: `${piece.delay}ms`,
              transitionDuration: `${pixelFadeInDuration}ms`,
            }}
          >
            <img
              alt=""
              aria-hidden="true"
              className={cn(
                "size-full rounded-xl object-cover",
                grayscaleAnimation && (showColor ? "grayscale-0" : "grayscale"),
              )}
              draggable={false}
              height={800}
              src={src}
              style={{
                transition: grayscaleAnimation
                  ? `filter ${pixelFadeInDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
                  : "none",
              }}
              width={800}
            />
          </div>
        ))}

        {overlayText ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl bg-background/70 px-6 py-4 text-center backdrop-blur-md">
              <div className="font-display text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
                {overlayText}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {showReplayButton ? (
        <button
          type="button"
          className="absolute right-2 top-2 z-10 rounded-lg bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm transition-opacity hover:bg-black/70"
          onClick={resetAnimation}
        >
          Replay
        </button>
      ) : null}
    </div>
  )
}
