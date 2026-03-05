"use client"

import Link from "next/link"
import type { ComponentConfig } from "@measured/puck"
import { Check, Server, Unlock } from "lucide-react"

import { EditableText } from "@/components/demo/editable"
import { demoKey } from "@/components/demo/demo-helpers"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Section, SectionHeading } from "@/components/ui/section"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type StringItem = string | { value?: string }

type PricingTier = {
  name: string
  price: string
  summary: string
  includes: StringItem[]
  timeline: string
  ongoing: string
}

type HostingCard = {
  title: string
  description: string
  highlight: string
}

export type PricingHostingProps = {
  id?: string
  heading: string
  subheading: string
  includesHeading: string
  timelineHeading: string
  ongoingLabel: string
  hostingHeading: string
  hostingNotes: StringItem[]
  tiers: PricingTier[]
  hostingCards: HostingCard[]
  note: string
  ctaLabel: string
  ctaHref: string
}

function normalizeItem(item: StringItem | undefined) {
  return typeof item === "string" ? item : item?.value || ""
}

export function PricingHosting(props: PricingHostingProps) {
  const key = (path: string) => demoKey(props.id, path)
  const tiers = props.tiers || []
  const hostingCards = props.hostingCards || []

  return (
    <Section id="pricing" size="hero">
      <SectionHeading>
        <span className="inline-flex items-center justify-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground"
            aria-hidden
          >
            <circle cx="12" cy="12" r="8" />
            <line x1="3" x2="6" y1="3" y2="6" />
            <line x1="21" x2="18" y1="3" y2="6" />
            <line x1="3" x2="6" y1="21" y2="18" />
            <line x1="21" x2="18" y1="21" y2="18" />
          </svg>
          <EditableText demoKey={key("pricing.heading")} value={props.heading} as="span" showIcon={false} />
        </span>
      </SectionHeading>

      <p className="mt-3 text-center text-muted-foreground">
        <EditableText
          demoKey={key("pricing.subheading")}
          value={props.subheading}
          as="span"
          multiline
          showIcon={false}
        />
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {tiers.map((tier, index) => (
          <Card key={`${tier.name}-${index}`} className="bg-background border-border shadow-none">
            <CardHeader className="gap-2">
              <Badge variant="outline" className="w-fit text-muted-foreground">
                <EditableText
                  demoKey={key(`pricing.tiers.${index}.name`)}
                  value={tier.name}
                  as="span"
                  showIcon={false}
                />
              </Badge>
              <CardTitle className="text-xl text-foreground">
                <EditableText
                  demoKey={key(`pricing.tiers.${index}.name`)}
                  value={tier.name}
                  as="span"
                  showIcon={false}
                />
              </CardTitle>
              <p className="text-2xl font-semibold text-foreground">
                <EditableText
                  demoKey={key(`pricing.tiers.${index}.price`)}
                  value={tier.price}
                  as="span"
                  showIcon={false}
                />
              </p>
              <CardDescription className="text-sm text-muted-foreground">
                <EditableText
                  demoKey={key(`pricing.tiers.${index}.summary`)}
                  value={tier.summary}
                  as="span"
                  multiline
                  showIcon={false}
                />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  <EditableText
                    demoKey={key("pricing.includesHeading")}
                    value={props.includesHeading}
                    as="span"
                    showIcon={false}
                  />
                </p>
                <ul className="space-y-2">
                  {(tier.includes || []).map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                      <span>
                        <EditableText
                          demoKey={key(`pricing.tiers.${index}.includes.${itemIndex}`)}
                          value={normalizeItem(item)}
                          as="span"
                          showIcon={false}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">
                  <EditableText
                    demoKey={key("pricing.timelineHeading")}
                    value={props.timelineHeading}
                    as="span"
                    showIcon={false}
                  />
                </span>
                <span className="text-muted-foreground">
                  <EditableText
                    demoKey={key(`pricing.tiers.${index}.timeline`)}
                    value={tier.timeline}
                    as="span"
                    showIcon={false}
                  />
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  <EditableText
                    demoKey={key("pricing.ongoingLabel")}
                    value={props.ongoingLabel}
                    as="span"
                    showIcon={false}
                  />
                </span>{" "}
                <EditableText
                  demoKey={key(`pricing.tiers.${index}.ongoing`)}
                  value={tier.ongoing}
                  as="span"
                  multiline
                  showIcon={false}
                />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-5">
        <p className="text-sm font-semibold text-foreground">
          <EditableText
            demoKey={key("pricing.hostingHeading")}
            value={props.hostingHeading}
            as="span"
            showIcon={false}
          />
        </p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {(props.hostingNotes || []).map((item, itemIndex) => (
            <li key={itemIndex}>
              <EditableText
                demoKey={key(`pricing.hostingNotes.${itemIndex}`)}
                value={normalizeItem(item)}
                as="span"
                showIcon={false}
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {hostingCards.map((card, index) => (
          <Card key={`${card.title}-${index}`} className="bg-background border-border shadow-none">
            <CardHeader className="gap-2">
              <div className="flex items-center gap-2 text-foreground">
                {card.title.toLowerCase().includes("hosting") ? (
                  <Server className="h-4 w-4 text-primary" />
                ) : (
                  <Unlock className="h-4 w-4 text-primary" />
                )}
                <CardTitle className="text-lg text-foreground">
                  <EditableText
                    demoKey={key(`hosting.cards.${index}.title`)}
                    value={card.title}
                    as="span"
                    showIcon={false}
                  />
                </CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                <EditableText
                  demoKey={key(`hosting.cards.${index}.description`)}
                  value={card.description}
                  as="span"
                  multiline
                  showIcon={false}
                />
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs font-medium text-foreground">
                <EditableText
                  demoKey={key(`hosting.cards.${index}.highlight`)}
                  value={card.highlight}
                  as="span"
                  showIcon={false}
                />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <EditableText demoKey={key("pricing.note")} value={props.note} as="span" multiline showIcon={false} />
      </p>

      <div className="mt-6 flex justify-center">
        <Button asChild size="lg" className="rounded-full px-6">
          <Link href={props.ctaHref || "#booking"}>
            <EditableText demoKey={key("pricing.ctaLabel")} value={props.ctaLabel} as="span" showIcon={false} />
          </Link>
        </Button>
      </div>
    </Section>
  )
}

export const pricingHostingConfig: ComponentConfig<PricingHostingProps> = {
  fields: {
    heading: { type: "text" },
    subheading: { type: "textarea" },
    includesHeading: { type: "text" },
    timelineHeading: { type: "text" },
    ongoingLabel: { type: "text" },
    hostingHeading: { type: "text" },
    hostingNotes: { type: "array", arrayFields: { value: { type: "text" } } },
    tiers: {
      type: "array",
      arrayFields: {
        name: { type: "text" },
        price: { type: "text" },
        summary: { type: "textarea" },
        includes: { type: "array", arrayFields: { value: { type: "text" } } },
        timeline: { type: "text" },
        ongoing: { type: "textarea" },
      },
    },
    hostingCards: {
      type: "array",
      arrayFields: {
        title: { type: "text" },
        description: { type: "textarea" },
        highlight: { type: "text" },
      },
    },
    note: { type: "textarea" },
    ctaLabel: { type: "text" },
    ctaHref: { type: "text" },
  },
  defaultProps: {
    heading: "",
    subheading: "",
    includesHeading: "",
    timelineHeading: "",
    ongoingLabel: "",
    hostingHeading: "",
    hostingNotes: [],
    tiers: [],
    hostingCards: [],
    note: "",
    ctaLabel: "",
    ctaHref: "#booking",
  },
  render: (props) => <PricingHosting {...props} />,
}
