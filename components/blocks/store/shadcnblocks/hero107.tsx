"use client"

import type { ComponentConfig } from "@measured/puck"
import { MoonStar, Sparkles } from "lucide-react"

import { ShadcnblocksContainer } from "@/components/blocks/store/shadcnblocks/shared"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { r2PublicUrl } from "@/lib/public-assets"

export type ShadcnblocksHero107Props = {
  badgeLabel: string
  eyebrow: string
  headline: string
  description: string
  ctaLabel: string
  ctaHref: string
  secondaryCtaLabel: string
  secondaryCtaHref: string
  imageSrc: string
  imageAlt: string
}

export function ShadcnblocksHero107(props: ShadcnblocksHero107Props) {
  return (
    <ShadcnblocksContainer>
      <section className="bg-transparent py-8">
        <div className="container">
          <div className="flex flex-col justify-between gap-12 lg:flex-row lg:gap-8">
            <div className="mx-auto flex max-w-[43.75rem] flex-col gap-8 lg:mx-0">
              <div className="flex flex-col gap-6">
                <div className="m-auto flex w-fit flex-nowrap items-center gap-2 rounded-3xl border px-4 py-2 lg:m-0">
                  <Sparkles className="size-5 text-primary" />
                  <div className="text-base font-light">{props.badgeLabel}</div>
                </div>
                <h1 className="inline-block text-center font-serif text-4xl text-foreground md:text-6xl md:leading-snug lg:text-left">
                  <span className="bg-linear-to-br from-foreground/20 to-muted-foreground bg-clip-text text-transparent">
                    {props.eyebrow}
                  </span>
                  <br />
                  {props.headline}
                </h1>
              </div>
              <div>
                <div className="mx-auto w-fit lg:mx-0">
                  <Button
                    asChild
                    className="group relative grid h-fit overflow-hidden rounded-full px-7 py-5"
                  >
                    <a href={props.ctaHref}>
                      <span className="spark mask-gradient absolute inset-0 h-[100%] w-[100%] animate-flip-btn overflow-hidden rounded-full [mask:linear-gradient(white,transparent_50%)] before:absolute before:[inset:0_auto_auto_50%] before:aspect-square before:w-[200%] before:[translate:-50%_-15%] before:rotate-[-90deg] before:animate-rotate-btn before:bg-[conic-gradient(from_0deg,transparent_0_340deg,var(--vd-muted-fg)_360deg)] before:content-['']" />
                      <span className="backdrop absolute inset-[2.5px] rounded-full bg-primary transition-colors duration-200 group-hover:bg-primary/90" />
                      <span className="text z-10 text-center font-medium text-primary-foreground">
                        {props.ctaLabel}
                      </span>
                    </a>
                  </Button>
                </div>
                <div className="my-9 h-px w-full bg-border" />
                <p className="mx-auto w-full max-w-[30rem] text-center text-lg font-light text-foreground lg:mx-0 lg:text-left">
                  {props.description}
                </p>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[31.25rem]">
              <div className="relative mx-auto w-full max-w-full lg:mx-0">
                <div className="w-full overflow-hidden rounded-3xl">
                  <AspectRatio ratio={1}>
                    <img
                      src={props.imageSrc}
                      alt={props.imageAlt}
                      className="size-full object-cover"
                    />
                  </AspectRatio>
                </div>
                <div className="absolute right-0 bottom-0">
                  <Button
                    asChild
                    variant="secondary"
                    className="m-4 flex h-fit items-center gap-2 rounded-xl px-5 py-4 text-xl font-semibold shadow-md"
                  >
                    <a href={props.secondaryCtaHref}>
                      <MoonStar className="size-6" />
                      <div>{props.secondaryCtaLabel}</div>
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ShadcnblocksContainer>
  )
}

export const shadcnblocksHero107Config: ComponentConfig<ShadcnblocksHero107Props> = {
  fields: {
    badgeLabel: { type: "text" },
    eyebrow: { type: "text" },
    headline: { type: "text" },
    description: { type: "textarea" },
    ctaLabel: { type: "text" },
    ctaHref: { type: "text" },
    secondaryCtaLabel: { type: "text" },
    secondaryCtaHref: { type: "text" },
    imageSrc: { type: "text" },
    imageAlt: { type: "text" },
  },
  defaultProps: {
    badgeLabel: "Free Portfolio Template",
    eyebrow: "Your Trusted Collaborator",
    headline: "for Digital Services",
    description:
      "Assisting startups and brands in creating impactful and engaging solutions for their software requirements.",
    ctaLabel: "Click Here",
    ctaHref: "#",
    secondaryCtaLabel: "Hire Me",
    secondaryCtaHref: "#",
    imageSrc: r2PublicUrl("logo.webp"),
    imageAlt: "Blue Brachiosaurus mascot",
  },
  render: (props) => <ShadcnblocksHero107 {...props} />,
}
