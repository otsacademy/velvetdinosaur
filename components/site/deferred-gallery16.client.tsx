"use client"

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react"
import { ArrowRight, ExternalLink } from "lucide-react"

import type {
  Gallery16Item,
  ShadcnblocksGallery16Props,
} from "@/components/blocks/store/shadcnblocks/gallery16"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { cn } from "@/lib/utils"

type GalleryComponent = ComponentType<ShadcnblocksGallery16Props>

export function DeferredGallery16(props: ShadcnblocksGallery16Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [Gallery, setGallery] = useState<GalleryComponent | null>(null)

  useEffect(() => {
    if (Gallery) return
    const element = rootRef.current
    if (!element) return

    let cancelled = false
    const loadGallery = () => {
      void import("@/components/blocks/store/shadcnblocks/gallery16").then((module) => {
        if (!cancelled) setGallery(() => module.ShadcnblocksGallery16)
      })
    }

    if (!("IntersectionObserver" in window)) {
      loadGallery()
      return () => {
        cancelled = true
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          loadGallery()
        }
      },
      { rootMargin: "600px 0px" },
    )

    observer.observe(element)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [Gallery])

  return (
    <div ref={rootRef}>
      {Gallery ? <Gallery {...props} /> : <StaticGallery16 {...props} />}
    </div>
  )
}

function StaticGallery16({
  items,
  containerClassName,
  sectionClassName,
}: ShadcnblocksGallery16Props) {
  const item = items[0]
  if (!item) return null

  return (
    <div className={cn("mx-auto w-full", containerClassName)}>
      <section className={cn("overflow-hidden py-8", sectionClassName)}>
        <div className="container">
          <div className="mb-8 flex justify-center">
            <div
              role="group"
              aria-label="Selected work categories"
              className="relative flex h-auto flex-wrap gap-6 bg-background"
            >
              {items.map((entry, index) => (
                <span
                  key={`${entry.category}-${index}`}
                  className={cn(
                    "inline-flex items-center justify-center px-1 py-1 text-base font-medium text-[var(--vd-muted-fg)] md:whitespace-nowrap",
                    index === 0 && "text-[var(--vd-fg)]",
                  )}
                >
                  {entry.category}
                </span>
              ))}
              <span className="absolute bottom-0 left-0 h-0.5 w-16 bg-primary" />
            </div>
          </div>
          <StaticGalleryCard item={item} />
        </div>
      </section>
    </div>
  )
}

function StaticGalleryCard({ item }: { item: Gallery16Item }) {
  const bullets = (item.bullets || [])
    .map((bullet) => (typeof bullet === "string" ? bullet : bullet?.value))
    .filter((bullet): bullet is string => Boolean(bullet))

  return (
    <div className="grid h-full max-w-4xl gap-10 rounded-xl border border-border p-6 shadow-sm select-none sm:p-10 md:max-h-[450px] md:grid-cols-2 lg:gap-20">
      <div className="flex flex-col justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium sm:text-4xl">
            <span className="bg-gradient-to-b from-foreground/20 to-muted-foreground bg-clip-text text-transparent">
              {item.eyebrow}
            </span>
            <br />
            {item.title}
          </h2>
          <div className="mt-4 space-y-4 text-sm text-muted-foreground sm:mt-6">
            {item.description ? <p>{item.description}</p> : null}
            {bullets.length ? (
              <ul className="ml-6 list-disc">
                {bullets.map((bullet, bulletIdx) => (
                  <li key={`${bullet}-${bulletIdx}`}>{bullet}</li>
                ))}
              </ul>
            ) : null}
            {item.descriptionSecondary ? <p>{item.descriptionSecondary}</p> : null}
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">{item.note}</p>
          {(item.primaryHref && item.primaryLabel) || (item.secondaryHref && item.secondaryLabel) ? (
            <div className="flex flex-wrap items-center gap-3">
              {item.primaryHref && item.primaryLabel ? (
                <a
                  href={item.primaryHref}
                  className="vd-dino-cta inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium"
                >
                  {item.primaryLabel}
                  <ArrowRight className="h-4 w-4 vd-inline-arrow" />
                </a>
              ) : null}
              {item.secondaryHref && item.secondaryLabel ? (
                <a
                  href={item.secondaryHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[var(--vd-border)] bg-transparent px-5 text-sm font-medium transition-colors hover:bg-[var(--vd-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vd-ring)]"
                >
                  {item.secondaryLabel}
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className="group rounded-xl border border-border p-2 md:min-h-0">
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl md:h-full md:min-h-[280px]">
          <OptimizedImage
            src={item.image}
            alt={item.imageAlt}
            fill
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 768px) 420px, 100vw"
            loading="lazy"
            decoding="async"
            imageOptions={{ width: 840, height: 525, fit: "cover" }}
          />
        </div>
      </div>
    </div>
  )
}
