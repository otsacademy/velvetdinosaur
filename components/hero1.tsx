/* eslint-disable @next/next/no-img-element -- block supports arbitrary media sources */
import type { CSSProperties, ReactNode } from "react"
import { ArrowRight, ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export interface Hero1Props {
  badge?: string
  badgeClassName?: string
  heading: string
  headingClassName?: string
  headingStyle?: CSSProperties
  description: string
  descriptionClassName?: string
  supportingLine?: string
  supportingLineClassName?: string
  buttons?: {
    primary?: {
      text: string
      url: string
      className?: string
      buttonClassName?: string
    }
    secondary?: {
      text: string
      url: string
      className?: string
      buttonClassName?: string
    }
  }
  image?: {
    src: string
    alt: string
  }
  imageSlot?: ReactNode
  className?: string
}

export function Hero1({
  badge = "Your Website Builder",
  badgeClassName,
  heading = "Blocks Built With Shadcn & Tailwind",
  headingClassName,
  headingStyle,
  description = "Finely crafted components built with React, Tailwind and Shadcn UI. Developers can copy and paste these blocks directly into their project.",
  descriptionClassName,
  supportingLine,
  supportingLineClassName,
  buttons = {
    primary: {
      text: "Discover all components",
      url: "https://www.shadcnblocks.com",
    },
    secondary: {
      text: "View on GitHub",
      url: "https://www.shadcnblocks.com",
    },
  },
  image,
  imageSlot,
  className,
}: Hero1Props) {
  return (
    <section className={cn("py-28", className)}>
      <div className="container">
        <div className="grid items-center gap-11 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,1fr)] lg:gap-16">
          <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
            {badge ? (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full border-[color-mix(in_oklch,var(--vd-border)_82%,transparent)] bg-card px-4 py-[0.4rem] text-[0.7rem] font-medium tracking-[0.04em] text-[var(--vd-muted-fg)] opacity-90",
                  badgeClassName
                )}
              >
                {badge}
                <ArrowUpRight className="ml-2 size-4 vd-inline-arrow" />
              </Badge>
            ) : null}
            <h1
              className={cn("vd-hero-heading mb-1 leading-[1.08] tracking-[-0.01em]", headingClassName)}
              style={headingStyle}
            >
              {heading}
            </h1>
            <p
              className={cn(
                "max-w-[30rem] text-base leading-7 [color:color-mix(in_oklch,var(--vd-copy)_82%,var(--vd-bg))] lg:text-[1.0625rem]",
                descriptionClassName
              )}
            >
              {description}
            </p>
            <div className="mt-3 flex w-full flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              {buttons?.primary ? (
                <Button
                  asChild
                  className={cn("w-full sm:w-auto", buttons.primary.buttonClassName)}
                >
                  <a href={buttons.primary.url} className={buttons.primary.className}>
                    {buttons.primary.text}
                  </a>
                </Button>
              ) : null}
              {buttons?.secondary ? (
                <Button
                  asChild
                  variant="outline"
                  className={cn("w-full sm:w-auto", buttons.secondary.buttonClassName)}
                >
                  <a href={buttons.secondary.url} className={buttons.secondary.className}>
                    {buttons.secondary.text}
                    <ArrowRight className="size-4 vd-inline-arrow" />
                  </a>
                </Button>
              ) : null}
            </div>
            {supportingLine ? (
              <p
                className={cn(
                  "vd-hero-note max-w-[32rem] text-sm leading-relaxed text-[var(--vd-copy)] lg:text-[0.975rem]",
                  supportingLineClassName
                )}
              >
                {supportingLine}
              </p>
            ) : null}
          </div>

          {imageSlot ? imageSlot : null}
          {!imageSlot && image ? (
            <img src={image.src} alt={image.alt} className="aspect-video w-full rounded-md object-cover" />
          ) : null}
        </div>
      </div>
    </section>
  )
}
