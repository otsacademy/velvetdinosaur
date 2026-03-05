/* eslint-disable @next/next/no-img-element */
import type { ComponentConfig } from "@measured/puck"
import { ArrowRight, CheckCircle2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { r2PublicUrl } from "@/lib/public-assets"

export type MakeHeroProps = {
  id?: string
  eyebrow?: string
  headline: string
  subheadline?: string
  primaryCtaLabel?: string
  primaryCtaHref?: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
  imageSrc?: string
  imageAlt?: string
}

const HIGHLIGHT_WORDS = ["convert", "edit"]

function renderHeadline(text: string) {
  if (!text) return null
  const pattern = new RegExp(`(${HIGHLIGHT_WORDS.join("|")})`, "gi")
  const parts = text.split(pattern)
  return parts.map((part, index) => {
    const isHighlight = HIGHLIGHT_WORDS.some(
      (word) => part.toLowerCase() === word.toLowerCase(),
    )
    if (!isHighlight) return <span key={`${part}-${index}`}>{part}</span>
    return (
      <span key={`${part}-${index}`} className="text-primary">
        {part}
      </span>
    )
  })
}

export function MakeHero({
  eyebrow,
  headline,
  subheadline,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  imageSrc,
  imageAlt,
}: MakeHeroProps) {
  return (
    <section className="relative overflow-hidden bg-background pt-32 pb-20 lg:pt-48 lg:pb-32">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-background to-background" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div>
            {eyebrow ? (
              <Badge
                variant="outline"
                className="mb-6 inline-flex items-center gap-2 rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                {eyebrow}
              </Badge>
            ) : null}
            <h1 className="mb-6 text-4xl font-bold leading-[1.15] tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {renderHeadline(headline)}
            </h1>
            {subheadline ? (
              <p className="mb-8 max-w-lg text-lg leading-relaxed text-muted-foreground md:text-xl">
                {subheadline}
              </p>
            ) : null}
            <div className="mb-10 flex flex-col gap-4 sm:flex-row">
              {primaryCtaLabel && primaryCtaHref ? (
                <Button
                  asChild
                  size="lg"
                  className="rounded-lg px-8 py-4 text-base font-semibold"
                >
                  <a href={primaryCtaHref}>
                    {primaryCtaLabel}
                    <ArrowRight className="h-5 w-5" />
                  </a>
                </Button>
              ) : null}
              {secondaryCtaLabel && secondaryCtaHref ? (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-lg px-8 py-4 text-base font-semibold"
                >
                  <a href={secondaryCtaHref}>{secondaryCtaLabel}</a>
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Transparent pricing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Next.js Speed</span>
              </div>
            </div>
          </div>
          <div className="relative w-full lg:h-[600px]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted/40 shadow-2xl lg:h-full lg:aspect-auto">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={imageAlt || "Hero image"}
                  className="h-full w-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 hidden rounded-xl border border-border/60 bg-card/90 p-4 shadow-xl backdrop-blur sm:block">
                <div className="mb-3 flex items-center gap-3 border-b border-border/50 pb-2">
                  <div className="h-3 w-3 rounded-full bg-muted-foreground/40" />
                  <div className="h-3 w-3 rounded-full bg-muted-foreground/55" />
                  <div className="h-3 w-3 rounded-full bg-muted-foreground/70" />
                  <span className="ml-auto text-xs text-muted-foreground">CMS Editor Mode</span>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export const makeHeroConfig: ComponentConfig<MakeHeroProps> = {
  fields: {
    eyebrow: { type: "text" },
    headline: { type: "text" },
    subheadline: { type: "textarea" },
    primaryCtaLabel: { type: "text" },
    primaryCtaHref: { type: "text" },
    secondaryCtaLabel: { type: "text" },
    secondaryCtaHref: { type: "text" },
    imageSrc: { type: "text" },
    imageAlt: { type: "text" },
  },
  defaultProps: {
    eyebrow: "Accepting new projects for March",
    headline: "Websites built to convert and stay easy to edit.",
    subheadline:
      "Stop fighting your CMS. We build fast, SEO-ready marketing sites that your team can actually manage. No code required for daily edits.",
    primaryCtaLabel: "Book a discovery call",
    primaryCtaHref: "#contact",
    secondaryCtaLabel: "View our work",
    secondaryCtaHref: "#work",
    imageSrc: r2PublicUrl("logo.webp"),
    imageAlt: "Blue Brachiosaurus mascot",
  },
  render: (props) => <MakeHero {...props} />,
}
