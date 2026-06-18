"use client"

import {
  useEffect,
  useRef,
  useState,
  type IframeHTMLAttributes,
} from "react"

import { cn } from "@/lib/utils"

type DeferredIframeProps = Omit<IframeHTMLAttributes<HTMLIFrameElement>, "src"> & {
  src: string
  placeholderLabel: string
  rootMargin?: string
}

export function DeferredIframe({
  src,
  title,
  className,
  placeholderLabel,
  rootMargin = "900px 0px",
  ...props
}: DeferredIframeProps) {
  const [shouldLoad, setShouldLoad] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (shouldLoad) return
    const element = rootRef.current
    if (!element) return

    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [rootMargin, shouldLoad])

  return (
    <div ref={rootRef} className="relative h-full w-full">
      {shouldLoad ? (
        <iframe
          title={title}
          src={src}
          className={className}
          {...props}
        />
      ) : (
        <button
          type="button"
          className={cn(
            "flex h-full w-full items-center justify-center bg-muted/30 px-4 text-sm font-medium text-[var(--vd-muted-fg)] transition-colors hover:bg-muted/45 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vd-ring)]",
            className,
          )}
          onClick={() => setShouldLoad(true)}
          aria-label={`Load ${title || placeholderLabel}`}
        >
          {placeholderLabel}
        </button>
      )}
    </div>
  )
}
