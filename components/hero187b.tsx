'use client'

import Image from 'next/image'
import Autoplay from 'embla-carousel-autoplay'
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Gauge,
  PanelsTopLeft,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CarouselApi } from '@/components/ui/carousel'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { cn } from '@/lib/utils'

type Hero187bIcon = typeof Briefcase

export type Hero187bFeature = {
  title: string
  description: string
  icon?: Hero187bIcon
}

export type Hero187bSlide = {
  src: string
  alt: string
  label: string
  kicker?: string
  fit?: 'contain' | 'cover'
}

export interface Hero187bProps {
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
  features?: Hero187bFeature[]
  slides: readonly [Hero187bSlide, ...Hero187bSlide[]]
  autoplay?: boolean
  className?: string
}

const DEFAULT_FEATURES: Hero187bFeature[] = [
  {
    title: 'Founder-led delivery',
    description: 'Work directly with Ian from the first conversation through launch.',
    icon: Briefcase,
  },
  {
    title: 'Search-ready performance',
    description: 'Lean builds tuned for speed, clarity, and strong Lighthouse scores.',
    icon: Gauge,
  },
  {
    title: 'Bespoke builds',
    description: 'Custom websites, CMS tools, and apps when templates stop fitting.',
    icon: PanelsTopLeft,
  },
  {
    title: 'Proper handover',
    description: 'No lock-in, no mystery admin, and a codebase you can actually keep.',
    icon: ShieldCheck,
  },
]

export function Hero187b({
  badge,
  heading,
  description,
  supportingLine,
  buttons,
  features = DEFAULT_FEATURES,
  slides,
  autoplay = true,
  className,
}: Hero187bProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [api, setApi] = useState<CarouselApi>()
  const autoplayPlugin = useRef(Autoplay({ delay: 4200, stopOnInteraction: true }))

  useEffect(() => {
    if (!api) return

    const updateSlide = () => {
      setCurrentSlide(api.selectedScrollSnap())
    }

    updateSlide()
    api.on('select', updateSlide)
    api.on('reInit', updateSlide)

    return () => {
      api.off('select', updateSlide)
      api.off('reInit', updateSlide)
    }
  }, [api])

  return (
    <section className={cn('relative overflow-hidden py-8 md:py-10 lg:py-8', className)}>
      <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
        <div className="order-2 space-y-4 lg:order-1">
          <div className="overflow-hidden rounded-[calc(var(--vd-radius)+18px)] border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_92%,var(--vd-bg))] p-3 shadow-[0_24px_70px_-52px_color-mix(in_oklch,var(--vd-fg)_22%,transparent)] sm:p-4">
            <Carousel
              className="size-full"
              setApi={setApi}
              opts={{ loop: true }}
              plugins={autoplay ? [autoplayPlugin.current] : []}
            >
              <CarouselContent>
                {slides.map((slide) => (
                  <CarouselItem key={slide.label}>
                    <div className="overflow-hidden rounded-[calc(var(--vd-radius)+12px)] border border-[color-mix(in_oklch,var(--vd-border)_74%,transparent)] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--vd-bg)_94%,var(--vd-primary)_6%),color-mix(in_oklch,var(--vd-card)_96%,var(--vd-bg)))]">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={slide.src}
                          alt={slide.alt}
                          fill
                          sizes="(max-width: 1024px) 100vw, 52vw"
                          priority={slide === slides[0]}
                          className={cn(
                            'transition-transform duration-500',
                            slide.fit === 'contain'
                              ? 'object-contain p-6 sm:p-8'
                              : 'object-cover object-top'
                          )}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_58%,color-mix(in_oklch,var(--vd-bg)_86%,transparent)_100%)]" />
                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
                          <div className="space-y-2">
                            {slide.kicker ? (
                              <span className="inline-flex rounded-full border border-[color-mix(in_oklch,var(--vd-border)_74%,transparent)] bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--vd-muted-fg)]">
                                {slide.kicker}
                              </span>
                            ) : null}
                            <p className="text-base font-semibold text-foreground sm:text-lg">{slide.label}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          <SlideIndicator currentSlide={currentSlide} slides={slides} api={api || null} />
        </div>

        <div className="order-1 space-y-7 lg:order-2 lg:space-y-8">
          <div className="space-y-5">
            {badge ? (
              <Badge
                variant="outline"
                className="rounded-full border-[color-mix(in_oklch,var(--vd-border)_82%,transparent)] bg-card px-4 py-2 text-[0.75rem] font-medium text-[var(--vd-muted-fg)]"
              >
                {badge}
                <ArrowUpRight className="ml-2 size-4 vd-inline-arrow" />
              </Badge>
            ) : null}

            <div className="space-y-5">
              <h1
                className="vd-hero-heading max-w-[14ch] text-4xl font-semibold text-foreground sm:text-[3.5rem] lg:text-[clamp(4rem,5vw,5.1rem)]"
                style={{ fontFamily: 'var(--vd-font-hero)' }}
              >
                {heading}
              </h1>
              <p className="max-w-[34rem] text-base leading-[1.72] text-[var(--vd-copy)] lg:text-[1.0625rem]">
                {description}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon || DEFAULT_FEATURES[index % DEFAULT_FEATURES.length]?.icon || Briefcase

              return (
                <div
                  key={feature.title}
                  className="rounded-[calc(var(--vd-radius)+8px)] border border-[color-mix(in_oklch,var(--vd-border)_78%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_94%,var(--vd-bg))] p-4"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--vd-dino-blue)_18%,transparent)] bg-[color-mix(in_oklch,var(--vd-dino-blue)_9%,transparent)] text-[var(--vd-dino-blue)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--vd-copy)]">{feature.description}</p>
                </div>
              )
            })}
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            {buttons?.primary ? (
              <Button asChild className={cn('w-full sm:w-auto', buttons.primary.buttonClassName)}>
                <a href={buttons.primary.url} className={buttons.primary.className}>
                  {buttons.primary.text}
                </a>
              </Button>
            ) : null}
            {buttons?.secondary ? (
              <Button
                asChild
                variant="outline"
                className={cn('w-full sm:w-auto', buttons.secondary.buttonClassName)}
              >
                <a href={buttons.secondary.url} className={buttons.secondary.className}>
                  <span className="flex items-center gap-2">
                    {buttons.secondary.text}
                    <ArrowRight className="size-4 vd-inline-arrow" />
                  </span>
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
      </div>
    </section>
  )
}

function SlideIndicator({
  currentSlide,
  slides,
  api,
}: {
  currentSlide: number
  slides: readonly Hero187bSlide[]
  api: CarouselApi | null
}) {
  return (
    <div className="flex flex-col gap-2 text-sm font-medium">
      <div>
        <span className="text-[var(--vd-muted-fg)]">
          {currentSlide + 1} of {slides.length} -
        </span>{' '}
        <span className="text-primary">{slides[currentSlide]?.label}</span>
      </div>
      <div className="flex gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.label}
            type="button"
            onClick={() => api?.scrollTo(index)}
            aria-label={`Go to ${slide.label}`}
            className={cn(
              'h-1.5 rounded-full transition-all',
              index === currentSlide
                ? 'w-10 bg-primary'
                : 'w-6 bg-[color-mix(in_oklch,var(--vd-primary)_18%,transparent)] hover:bg-[color-mix(in_oklch,var(--vd-primary)_34%,transparent)]'
            )}
          />
        ))}
      </div>
    </div>
  )
}
