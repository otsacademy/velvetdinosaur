"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { ComponentConfig } from "@measured/puck"
import { ArrowRight, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"

import { ShadcnblocksContainer } from "@/components/blocks/store/shadcnblocks/shared"
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Magnetic } from "@/components/ui/magnetic"

type Gallery16Item = {
  category: string
  eyebrow: string
  title: string
  description: string
  descriptionSecondary?: string
  bullets: Array<string | { value?: string }>
  note: string
  image: string
  imageAlt: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export type ShadcnblocksGallery16Props = {
  items: Gallery16Item[]
  containerClassName?: string
  sectionClassName?: string
}

export function ShadcnblocksGallery16(props: ShadcnblocksGallery16Props) {
  const items = useMemo(() => props.items || [], [props.items])
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(items[0]?.category || "")
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 })

  useEffect(() => {
    if (items.length && !current) {
      setCurrent(items[0].category)
    }
  }, [items, current])

  useEffect(() => {
    const currentIndex = items.findIndex((item) => item.category === current)
    const activeTab = tabRefs.current[currentIndex]

    if (activeTab) {
      const { offsetWidth, offsetLeft } = activeTab
      setIndicatorStyle({ width: offsetWidth, left: offsetLeft })
    }
  }, [current, items])

  useEffect(() => {
    if (!api) return

    const currentIndex = items.findIndex((item) => item.category === current)
    if (currentIndex >= 0) {
      api.scrollTo(currentIndex)
    }

    const onSelect = () => {
      const idx = api.selectedScrollSnap()
      setCurrent(items[idx]?.category || "")
    }
    api.on("select", onSelect)

    return () => {
      api.off("select", onSelect)
    }
  }, [api, current, items])

  if (!items.length) return null

  return (
    <ShadcnblocksContainer className={props.containerClassName}>
      <section className={cn("overflow-hidden py-8", props.sectionClassName)}>
        <div className="container">
          <Carousel
            setApi={setApi}
            className="[&>div[data-slot=carousel-content]]:overflow-visible"
          >
            <div className="flex items-center justify-between">
              <div className="mb-8 flex justify-center">
                <div
                  role="group"
                  aria-label="Selected work categories"
                  className="relative flex h-auto flex-wrap gap-6 bg-background"
                >
                  {items.map((item, idx) => (
                    <button
                      key={idx}
                      ref={(el) => {
                        tabRefs.current[idx] = el
                      }}
                      type="button"
                      aria-pressed={item.category === current}
                      onClick={() => setCurrent(item.category)}
                      className={cn(
                        "inline-flex items-center justify-center px-1 py-1 text-base font-medium text-[var(--vd-muted-fg)] transition-all duration-700 ease-out hover:text-[var(--vd-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vd-ring)] md:whitespace-nowrap",
                        item.category === current && "text-[var(--vd-fg)]",
                      )}
                    >
                      {item.category}
                    </button>
                  ))}
                  <div
                    className="absolute bottom-0 h-0.5 bg-primary transition-all duration-700 ease-out"
                    style={{
                      width: `${indicatorStyle.width}px`,
                      left: `${indicatorStyle.left}px`,
                    }}
                  />
                </div>
              </div>
              <div className="hidden items-center gap-4 sm:flex">
                <CarouselPrevious className="static size-10 translate-0" />
                <CarouselNext className="static size-10 translate-0" />
              </div>
            </div>
            <CarouselContent className="max-w-4xl">
              {items.map((item, idx) => {
                const bullets = (item.bullets || [])
                  .map((bullet) => (typeof bullet === "string" ? bullet : bullet?.value))
                  .filter((bullet): bullet is string => Boolean(bullet))
                return (
                <CarouselItem key={idx} className="w-fit max-w-4xl">
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
                        <div className="mt-4 text-sm text-muted-foreground sm:mt-6 space-y-4">
                          {item.description ? <p>{item.description}</p> : null}
                          {bullets.length ? (
                            <ul className="ml-6 list-disc">
                              {bullets.map((bullet, bulletIdx) => (
                                <li key={`${bullet}-${bulletIdx}`}>{bullet}</li>
                              ))}
                            </ul>
                          ) : null}
                          {item.descriptionSecondary ? (
                            <p>{item.descriptionSecondary}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-xs text-muted-foreground">{item.note}</p>
                        {(item.primaryHref && item.primaryLabel) || (item.secondaryHref && item.secondaryLabel) ? (
                          <div className="flex flex-wrap items-center gap-3">
                            {item.primaryHref && item.primaryLabel ? (
                              <Magnetic strength={0.2}>
                                <Button asChild className="vd-dino-cta h-10 rounded-full px-5 text-sm font-medium">
                                  <a href={item.primaryHref}>
                                    {item.primaryLabel}
                                    <ArrowRight className="h-4 w-4 vd-inline-arrow" />
                                  </a>
                                </Button>
                              </Magnetic>
                            ) : null}
                            {item.secondaryHref && item.secondaryLabel ? (
                              <Magnetic strength={0.2}>
                                <Button
                                  asChild
                                  variant="outline"
                                  className="h-10 rounded-full px-5 text-sm font-medium"
                                >
                                  <a href={item.secondaryHref} target="_blank" rel="noreferrer">
                                    {item.secondaryLabel}
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              </Magnetic>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="group rounded-xl border border-border p-2">
                      <div className="overflow-hidden rounded-xl">
                        <motion.img
                          src={item.image}
                          alt={item.imageAlt}
                          className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                        />
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              )})}
            </CarouselContent>
          </Carousel>
        </div>
      </section>
    </ShadcnblocksContainer>
  )
}

export const shadcnblocksGallery16Config: ComponentConfig<ShadcnblocksGallery16Props> = {
  fields: {
    items: {
      type: "array",
      arrayFields: {
        category: { type: "text" },
        eyebrow: { type: "text" },
        title: { type: "text" },
        description: { type: "textarea" },
        descriptionSecondary: { type: "textarea" },
        bullets: {
          type: "array",
          arrayFields: { value: { type: "text" } },
        },
        note: { type: "textarea" },
        image: { type: "text" },
        imageAlt: { type: "text" },
      },
    },
  },
  defaultProps: {
    items: [
      {
        category: "Features",
        eyebrow: "Explore Our",
        title: "Core Features",
        description:
          "Dive deep into the robust functionalities designed to streamline your workflow. Benefit from intuitive design, seamless integration, and powerful customization options.",
        descriptionSecondary:
          "Explore how our platform adapts to your evolving needs, ensuring long-term value and efficiency.",
        bullets: [],
        note: "Comprehensive documentation and dedicated support channels are available to assist you.",
        image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg",
        imageAlt: "Core features preview",
      },
      {
        category: "Solutions",
        eyebrow: "Solutions for",
        title: "Every Scenario",
        description:
          "Discover how our platform addresses diverse challenges across various domains:",
        descriptionSecondary: "We provide adaptable tools for your unique context.",
        bullets: [
          "Enhancing team collaboration efficiency.",
          "Optimizing critical resource allocation.",
          "Streamlining complex data analysis.",
        ],
        note: "Leverage our expertise in integration and custom development for specific needs.",
        image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-2.svg",
        imageAlt: "Solutions preview",
      },
      {
        category: "Roadmap",
        eyebrow: "Building the",
        title: "Future Together",
        description:
          "Get a glimpse into our ongoing commitment to innovation and improvement:",
        descriptionSecondary:
          "We're constantly evolving based on user feedback and industry trends.",
        bullets: [
          "Next-generation user interface design.",
          "Advanced analytics capabilities rollout.",
          "Expanded third-party integration ecosystem.",
        ],
        note: "Our dedicated R&D team is focused on delivering cutting-edge solutions.",
        image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-3.svg",
        imageAlt: "Roadmap preview",
      },
    ],
  },
  render: (props) => <ShadcnblocksGallery16 {...props} />,
}
