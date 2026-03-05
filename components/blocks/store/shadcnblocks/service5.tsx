"use client"

import type { ComponentConfig } from "@measured/puck"
import { Code, Droplet, Layout, Smartphone } from "lucide-react"

import { ShadcnblocksContainer } from "@/components/blocks/store/shadcnblocks/shared"

const RELATED_ICONS = {
  Droplet,
  Code,
  Smartphone,
  Layout,
} as const

type RelatedIcon = keyof typeof RELATED_ICONS

type ServiceStat = {
  iconSrc: string
  iconAlt: string
  title: string
  description: string
  value?: string
}

type RelatedService = {
  icon: RelatedIcon
  title: string
  description: string
  href: string
}

type ServiceSection = {
  heading: string
  paragraphs: Array<string | { value?: string }>
  bullets: Array<string | { value?: string }>
}

export type ShadcnblocksService5Props = {
  headerIconSrc: string
  headerIconAlt: string
  title: string
  intro: string
  sections: ServiceSection[]
  expertiseTitle: string
  stats: ServiceStat[]
  relatedTitle: string
  relatedServices: RelatedService[]
}

export function ShadcnblocksService5(props: ShadcnblocksService5Props) {
  const sections = props.sections || []
  const stats = props.stats || []
  const relatedServices = props.relatedServices || []

  return (
    <ShadcnblocksContainer>
      <section className="py-8">
        <div className="container max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-12 space-y-8">
                <div className="flex justify-center lg:justify-start">
                  <div className="rounded-lg bg-muted p-4">
                    <img
                      src={props.headerIconSrc}
                      alt={props.headerIconAlt}
                      className="h-12 dark:invert"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h1 className="text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl">
                    {props.title}
                  </h1>
                  <p className="text-xl leading-relaxed text-muted-foreground">
                    {props.intro}
                  </p>
                </div>
              </div>

              <div className="prose prose-sm max-w-none dark:prose-invert">
                {sections.map((section, sectionIndex) => {
                  const paragraphs = (section.paragraphs || [])
                    .map((item) => (typeof item === "string" ? item : item?.value))
                    .filter((item): item is string => Boolean(item))
                  const bullets = (section.bullets || [])
                    .map((item) => (typeof item === "string" ? item : item?.value))
                    .filter((item): item is string => Boolean(item))

                  return (
                    <div key={`${section.heading}-${sectionIndex}`}>
                      {section.heading ? <h2>{section.heading}</h2> : null}
                      {paragraphs.map((paragraph, index) => (
                        <p key={`${sectionIndex}-${index}`}>{paragraph}</p>
                      ))}
                      {bullets.length ? (
                        <ul>
                          {bullets.map((item, index) => (
                            <li key={`${sectionIndex}-bullet-${index}`}>{item}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-8 lg:col-span-1">
              <div className="rounded-lg bg-muted/50 p-6">
                <h3 className="mb-6 text-lg font-semibold">{props.expertiseTitle}</h3>
                <div className="space-y-6">
                  {stats.map((stat, index) => (
                    <div key={`${stat.title}-${index}`} className="flex items-center gap-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
                        <img
                          src={stat.iconSrc}
                          alt={stat.iconAlt}
                          className="h-6 w-6 object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{stat.title}</div>
                        {stat.description ? (
                          <div className="text-xs text-muted-foreground">
                            {stat.description}
                          </div>
                        ) : null}
                        {stat.value ? (
                          <div className="text-xs font-semibold text-foreground">
                            {stat.value}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-6">
                <h3 className="mb-6 text-lg font-semibold">{props.relatedTitle}</h3>
                <div className="space-y-4">
                  {relatedServices.map((service, index) => {
                    const Icon = RELATED_ICONS[service.icon] || Layout
                    return (
                      <div key={`${service.title}-${index}`} className="group">
                        <a
                          href={service.href}
                          className="block space-y-1 rounded-md p-3 transition-colors hover:bg-background"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                            <div className="text-sm font-medium group-hover:text-primary">
                              {service.title}
                            </div>
                          </div>
                          {service.description ? (
                            <p className="text-xs text-muted-foreground">
                              {service.description}
                            </p>
                          ) : null}
                        </a>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ShadcnblocksContainer>
  )
}

export const shadcnblocksService5Config: ComponentConfig<ShadcnblocksService5Props> = {
  fields: {
    headerIconSrc: { type: "text" },
    headerIconAlt: { type: "text" },
    title: { type: "text" },
    intro: { type: "textarea" },
    sections: {
      type: "array",
      arrayFields: {
        heading: { type: "text" },
        paragraphs: { type: "array", arrayFields: { value: { type: "textarea" } } },
        bullets: { type: "array", arrayFields: { value: { type: "text" } } },
      },
    },
    expertiseTitle: { type: "text" },
    stats: {
      type: "array",
      arrayFields: {
        iconSrc: { type: "text" },
        iconAlt: { type: "text" },
        title: { type: "text" },
        description: { type: "textarea" },
        value: { type: "text" },
      },
    },
    relatedTitle: { type: "text" },
    relatedServices: {
      type: "array",
      arrayFields: {
        icon: {
          type: "select",
          options: [
            { label: "Droplet", value: "Droplet" },
            { label: "Code", value: "Code" },
            { label: "Smartphone", value: "Smartphone" },
            { label: "Layout", value: "Layout" },
          ],
        },
        title: { type: "text" },
        description: { type: "textarea" },
        href: { type: "text" },
      },
    },
  },
  defaultProps: {
    headerIconSrc: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/symbols/ux.svg",
    headerIconAlt: "Design and layouts",
    title: "Design & Layouts",
    intro: "Clean, calm interfaces that look great on any device.",
    sections: [
      {
        heading: "No Guesswork, No Surprises",
        paragraphs: [
          "We don't believe in \"revealing\" a website at the end and hoping you like it. Before we write a single line of code, we design the look and feel of your site so you can see exactly how it works.",
          "We focus on clarity. Your site needs to look professional, load instantly, and guide visitors to the right place without confusing them.",
        ],
        bullets: [],
      },
      {
        heading: "Designed for Real Life",
        paragraphs: [
          "Most agencies design for huge desktop monitors. We design for reality.",
          "We start by making sure your site works perfectly on mobile phones, where most of your customers are. Then we scale it up. We use clear text, high-contrast colours, and logical layouts that make your content easy to read and easy to find.",
        ],
        bullets: [],
      },
      {
        heading: "What we design",
        paragraphs: [],
        bullets: [
          "Customer Journeys: Planning exactly how a visitor becomes a customer.",
          "Interactive Previews: See a clickable version of your site before it's built.",
          "Mobile-Ready Layouts: Designs that work on phones, tablets, and laptops.",
          "Accessible Interfaces: Text and buttons that are easy for everyone to see and use.",
          "Brand Consistency: Fonts and colours that match your business identity.",
        ],
      },
    ],
    expertiseTitle: "Our Standard",
    stats: [
      {
        iconSrc: "/icon.svg",
        iconAlt: "Mobile First",
        title: "Mobile First",
        description: "Designed for phones from day one, not as an afterthought.",
        value: "",
      },
      {
        iconSrc: "/icon.svg",
        iconAlt: "Accessibility",
        title: "Accessibility",
        description: "Clear text and high contrast, tested to NHS-grade standards.",
        value: "",
      },
      {
        iconSrc: "/icon.svg",
        iconAlt: "Fast Loading",
        title: "Fast Loading",
        description: "Visuals optimized so they don't slow your site down.",
        value: "",
      },
    ],
    relatedTitle: "Related Services",
    relatedServices: [
      {
        icon: "Code",
        title: "Web Build",
        description: "Turning these designs into fast, secure code.",
        href: "#",
      },
      {
        icon: "Droplet",
        title: "Hosting & Care",
        description: "Daily backups and updates, handled for you.",
        href: "#",
      },
      {
        icon: "Layout",
        title: "Content Strategy",
        description: "Structuring your text so it sells.",
        href: "#",
      },
    ],
  },
  render: (props) => <ShadcnblocksService5 {...props} />,
}
