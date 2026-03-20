"use client"

import Link from "next/link"
import type { ComponentConfig } from "@measured/puck"

import { EditableImage, EditableText } from "@/components/content/editable"
import { contentKey } from "@/components/content/content-keys"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/ui/section"
import { TrustStrip } from "@/components/blocks/store/velvet/shared/trust-strip"
import { cn } from "@/lib/utils"

type HeroProofItem = {
  quote: string
  name: string
  role: string
  org?: string
  outcome?: string
}

type HeroProof = {
  heading: string
  outcomeLabel: string
  items: HeroProofItem[]
}

type HeroTrustedByItem = {
  name: string
  href: string
  logoUrl?: string
  logoClassName?: string
  slotClassName?: string
}

type StringItem = string | { value?: string }

export type HeroProps = {
  id?: string
  headline: string
  subheadline: string
  qualifier: string
  reassurance: StringItem[]
  primaryCtaLabel: string
  primaryCtaHref: string
  secondaryCtaLabel: string
  secondaryCtaHref: string
  imageUrl: string
  imageAlt: string
  trustedByLabel: string
  trustedBy: HeroTrustedByItem[]
  proof: HeroProof
  trustStripItems: StringItem[]
  trustStripVerifiedLabel: string
  showVerifiedBadge?: "true" | "false"
}

export function Hero(props: HeroProps) {
  const key = (path: string) => contentKey(props.id, path)
  const reassuranceItems = (props.reassurance || [])
    .map((item) => (typeof item === "string" ? item : item?.value))
    .filter((item): item is string => Boolean(item))
  const trustStripItems = (props.trustStripItems || [])
    .map((item) => (typeof item === "string" ? item : item?.value))
    .filter((item): item is string => Boolean(item))
  const shouldShowTrustStrip =
    trustStripItems.length > 0 || Boolean(props.trustStripVerifiedLabel)

  return (
    <Section size="hero" className="bg-background pt-24 sm:pt-28 md:pt-32 overflow-hidden">
      <div className="flex flex-col">
        <div className="flex flex-1 items-center pb-6">
          <div className="grid lg:grid-cols-2 gap-6 md:gap-10 items-start w-full">
            <div className="flex flex-col gap-6 pb-12 md:pb-14 lg:pb-16">
              <EditableText
                contentKey={key("hero.headline")}
                value={props.headline}
                as="h1"
                className="font-display text-5xl md:text-6xl lg:text-7xl font-normal text-foreground leading-[1.1] tracking-tight text-balance min-h-[1.2em] animate-fade-in"
              />
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg text-pretty leading-relaxed animate-fade-in-delay-1">
                <EditableText
                  contentKey={key("hero.subheadline")}
                  value={props.subheadline}
                  as="span"
                  multiline
                  showIcon={false}
                />
              </p>
              <div className="space-y-4 animate-fade-in-delay-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Button asChild size="lg" className="rounded-full px-8 shadow-md hover:shadow-lg">
                    <Link href={props.primaryCtaHref}>
                      <EditableText
                        contentKey={key("hero.primaryCta")}
                        value={props.primaryCtaLabel}
                        as="span"
                        showIcon={false}
                      />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                    <Link href={props.secondaryCtaHref}>
                      <EditableText
                        contentKey={key("hero.secondaryCta")}
                        value={props.secondaryCtaLabel}
                        as="span"
                        showIcon={false}
                      />
                    </Link>
                  </Button>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  <EditableText
                    contentKey={key("hero.qualifier")}
                    value={props.qualifier}
                    as="span"
                    showIcon={false}
                  />
                </p>
                {reassuranceItems.length ? (
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {reassuranceItems.map((item, index) => (
                      <span key={`${item}-${index}`} className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/60" aria-hidden />
                        <EditableText
                          contentKey={key(`hero.reassurance.${index}`)}
                          value={item}
                          as="span"
                          showIcon={false}
                        />
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  <EditableText
                    contentKey={key("hero.trustedByLabel")}
                    value={props.trustedByLabel}
                    as="span"
                    showIcon={false}
                  />
                </p>
                <div className="grid grid-cols-2 items-center gap-x-10 gap-y-6 sm:grid-cols-4">
                  {props.trustedBy.map((item, index) => {
                    const isAsap = item.name === "ASAP"
                    const logoSizeClass = isAsap ? "h-14 sm:h-16" : "h-28 sm:h-32"
                    const logoClassName = cn(
                      "w-auto object-contain opacity-95 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100",
                      item.logoClassName,
                      logoSizeClass,
                    )
                    const wrapperClassName = cn(
                      "group inline-flex items-center justify-center transition-transform duration-200 hover:scale-[1.03] focus-visible:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
                      isAsap ? "h-20" : null,
                      item.slotClassName,
                    )

                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${item.name} website`}
                        className={wrapperClassName}
                      >
                        {item.logoUrl ? (
                          <EditableImage
                            contentKey={key(`trustedBy.items.${index}.logo`)}
                            src={item.logoUrl}
                            alt={`${item.name} logo`}
                            width={160}
                            height={64}
                            className={logoClassName}
                          />
                        ) : null}
                        <span className="sr-only">{item.name}</span>
                      </a>
                    )
                  })}
                </div>
                {props.proof?.items?.length ? (
                  <div className="pt-2 space-y-2">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      <EditableText
                        contentKey={key("hero.proof.heading")}
                        value={props.proof.heading}
                        as="span"
                        showIcon={false}
                      />
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {props.proof.items.map((item, index) => (
                        <div
                          key={`${item.name}-${index}`}
                          className="rounded-xl border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground"
                        >
                          <p className="text-sm text-foreground">
                            &ldquo;
                            <EditableText
                              contentKey={key(`hero.proof.items.${index}.quote`)}
                              value={item.quote}
                              as="span"
                              multiline
                              showIcon={false}
                            />
                            &rdquo;
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="font-medium text-foreground">
                              <EditableText
                                contentKey={key(`hero.proof.items.${index}.name`)}
                                value={item.name}
                                as="span"
                                showIcon={false}
                              />
                            </span>
                            <span aria-hidden>&middot;</span>
                            <span>
                              <EditableText
                                contentKey={key(`hero.proof.items.${index}.role`)}
                                value={item.role}
                                as="span"
                                showIcon={false}
                              />
                              {item.org ? (
                                <>
                                  {", "}
                                  <EditableText
                                    contentKey={key(`hero.proof.items.${index}.org`)}
                                    value={item.org}
                                    as="span"
                                    showIcon={false}
                                  />
                                </>
                              ) : null}
                            </span>
                          </div>
                          {item.outcome ? (
                            <p className="mt-2 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                              <EditableText
                                contentKey={key("hero.proof.outcomeLabel")}
                                value={props.proof.outcomeLabel}
                                as="span"
                                showIcon={false}
                              />{" "}
                              <span className="normal-case tracking-normal">
                                <EditableText
                                  contentKey={key(`hero.proof.items.${index}.outcome`)}
                                  value={item.outcome}
                                  as="span"
                                  showIcon={false}
                                />
                              </span>
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-start justify-center md:justify-end mt-8 md:mt-0 lg:pt-6 animate-slide-up">
              <div className="relative w-[18rem] h-[22rem] md:w-[24rem] md:h-[30rem] lg:w-[28rem] lg:h-[35rem] origin-bottom hover-lift">
                <img
                  src="/dinosaur.webp"
                  alt="Velvet Dinosaur mascot"
                  width={560}
                  height={700}
                  loading="eager"
                  className="absolute inset-0 h-full w-full object-contain drop-shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
        {shouldShowTrustStrip ? (
          <div className="-mx-6 mt-auto pt-4">
            <TrustStrip
              contentId={props.id}
              items={trustStripItems}
              showVerifiedBadge={props.showVerifiedBadge}
              verifiedLabel={props.trustStripVerifiedLabel}
            />
          </div>
        ) : null}
      </div>
    </Section>
  )
}

export const heroConfig: ComponentConfig<HeroProps> = {
  fields: {
    headline: { type: "text" },
    subheadline: { type: "textarea" },
    qualifier: { type: "text" },
    reassurance: {
      type: "array",
      arrayFields: {
        value: { type: "text" },
      },
    },
    primaryCtaLabel: { type: "text" },
    primaryCtaHref: { type: "text" },
    secondaryCtaLabel: { type: "text" },
    secondaryCtaHref: { type: "text" },
    imageUrl: { type: "text" },
    imageAlt: { type: "text" },
    trustedByLabel: { type: "text" },
    trustedBy: {
      type: "array",
      arrayFields: {
        name: { type: "text" },
        href: { type: "text" },
        logoUrl: { type: "text" },
        logoClassName: { type: "text" },
        slotClassName: { type: "text" },
      },
    },
    proof: {
      type: "object",
      objectFields: {
        heading: { type: "text" },
        outcomeLabel: { type: "text" },
        items: {
          type: "array",
          arrayFields: {
            quote: { type: "textarea" },
            name: { type: "text" },
            role: { type: "text" },
            org: { type: "text" },
            outcome: { type: "text" },
          },
        },
      },
    },
    trustStripItems: {
      type: "array",
      arrayFields: {
        value: { type: "text" },
      },
    },
    trustStripVerifiedLabel: { type: "text" },
    showVerifiedBadge: {
      type: "select",
      options: [
        { label: "Show", value: "true" },
        { label: "Hide", value: "false" },
      ],
    },
  },
  defaultProps: {
    headline: "",
    subheadline: "",
    qualifier: "",
    reassurance: [],
    primaryCtaLabel: "",
    primaryCtaHref: "",
    secondaryCtaLabel: "",
    secondaryCtaHref: "",
    imageUrl: "/dinosaur.webp",
    imageAlt: "Velvet Dinosaur mascot",
    trustedByLabel: "TRUSTED BY",
    trustedBy: [],
    proof: {
      heading: "",
      outcomeLabel: "",
      items: [],
    },
    trustStripItems: [],
    trustStripVerifiedLabel: "",
    showVerifiedBadge: "true",
  },
  render: (props) => <Hero {...props} />,
}
