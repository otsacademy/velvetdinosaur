/* eslint-disable @next/next/no-img-element -- block supports arbitrary media sources */
import type { ReactNode } from "react"
import { ArrowRight, ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export interface Hero1Props {
  badge?: string
  heading: string
  description: string
  supportingLine?: string
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
  heading = "Blocks Built With Shadcn & Tailwind",
  description = "Finely crafted components built with React, Tailwind and Shadcn UI. Developers can copy and paste these blocks directly into their project.",
  supportingLine,
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
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,1fr)] lg:gap-14">
          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            {badge ? (
              <Badge
                variant="outline"
                className="rounded-full border-[color-mix(in_oklch,var(--vd-border)_82%,transparent)] bg-card px-4 py-2 text-[0.75rem] font-medium text-[var(--vd-muted-fg)]"
              >
                {badge}
                <ArrowUpRight className="ml-2 size-4 vd-inline-arrow" />
              </Badge>
            ) : null}
            <h1 className="vd-hero-heading max-w-[20ch] text-balance text-3xl text-foreground sm:text-4xl lg:text-5xl">
              {heading}
            </h1>
            <p className="max-w-[34rem] text-base leading-[1.72] text-[var(--vd-copy)] lg:text-[1.0625rem]">
              {description}
            </p>
            <div className="mt-2 flex w-full flex-col justify-center gap-3 sm:flex-row lg:justify-start">
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
              <p className="vd-hero-note max-w-[32rem] text-sm leading-relaxed text-[var(--vd-copy)] lg:text-[0.975rem]">
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
