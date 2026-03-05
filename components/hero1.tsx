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
  buttons?: {
    primary?: {
      text: string
      url: string
      className?: string
    }
    secondary?: {
      text: string
      url: string
      className?: string
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
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
            {badge ? (
              <Badge variant="outline">
                {badge}
                <ArrowUpRight className="ml-2 size-4" />
              </Badge>
            ) : null}
            <h1 className="text-4xl font-bold text-pretty lg:text-6xl">{heading}</h1>
            <p className="max-w-xl text-muted-foreground lg:text-xl">{description}</p>
            <div className="flex w-full flex-col justify-center gap-2 sm:flex-row lg:justify-start">
              {buttons?.primary ? (
                <Button asChild className="w-full sm:w-auto">
                  <a href={buttons.primary.url} className={buttons.primary.className}>
                    {buttons.primary.text}
                  </a>
                </Button>
              ) : null}
              {buttons?.secondary ? (
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <a href={buttons.secondary.url} className={buttons.secondary.className}>
                    {buttons.secondary.text}
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
              ) : null}
            </div>
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
