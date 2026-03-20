"use client"

import type { ComponentConfig } from "@measured/puck"
import { Check, Lock, Server, Shield, Sparkles } from "lucide-react"

import { EditableText } from "@/components/content/editable"
import { contentKey } from "@/components/content/content-keys"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Section, SectionHeading } from "@/components/ui/section"
import { AnimatedSection } from "@/components/ui/animated-section"

type StringItem = string | { value?: string }

type PricingBaseline = {
  label: string
  price: string
  includesSummary: string
  includesNote: string
}

type PricingClarifier = {
  heading: string
  bullets: StringItem[]
}

type PricingCta = {
  label: string
  href: string
}

type PricingCtas = {
  primary: PricingCta
  secondary: PricingCta
}

export type PricingSectionProps = {
  id?: string
  heading: string
  subheading: string
  baseline: PricingBaseline
  includesHeading: string
  inclusions: StringItem[]
  hostingHeading: string
  hostingItems: StringItem[]
  complexityNote: string
  clarifiers: PricingClarifier[]
  vatNote: string
  ctas: PricingCtas
}

const hostingIcons = [Server, Lock, Shield]

function normalizeItem(item: StringItem | undefined) {
  return typeof item === "string" ? item : item?.value || ""
}

export function PricingSection(props: PricingSectionProps) {
  const key = (path: string) => contentKey(props.id, path)
  const clarifiers = props.clarifiers || []

  return (
    <Section id="pricing" size="hero" className="bg-background" animate divider>
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="h-7 w-7 text-muted-foreground md:h-8 md:w-8" aria-hidden="true" />
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl font-display font-normal">
              <EditableText contentKey={key("pricing.heading")} value={props.heading} as="span" showIcon={false} />
            </h2>
          </div>
          <p className="text-sm text-muted-foreground md:text-base">
            <EditableText
              contentKey={key("pricing.subheading")}
              value={props.subheading}
              as="span"
              showIcon={false}
            />
          </p>
        </div>

        <Card className="border-border/70">
          <CardHeader className="space-y-3">
            <Badge variant="secondary" className="w-fit">
              <EditableText
                contentKey={key("pricing.baseline.label")}
                value={props.baseline?.label || ""}
                as="span"
                showIcon={false}
              />
            </Badge>
            <CardTitle className="text-3xl font-semibold md:text-4xl">
              <EditableText
                contentKey={key("pricing.baseline.price")}
                value={props.baseline?.price || ""}
                as="span"
                showIcon={false}
              />
            </CardTitle>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                <EditableText
                  contentKey={key("pricing.baseline.includesSummary")}
                  value={props.baseline?.includesSummary || ""}
                  as="span"
                  showIcon={false}
                />
              </p>
              <p className="text-xs text-muted-foreground">
                <EditableText
                  contentKey={key("pricing.baseline.includesNote")}
                  value={props.baseline?.includesNote || ""}
                  as="span"
                  showIcon={false}
                />
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-foreground">
                <EditableText
                  contentKey={key("pricing.includesHeading")}
                  value={props.includesHeading}
                  as="span"
                  showIcon={false}
                />
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {(props.inclusions || []).map((item, index) => (
                  <li key={`${index}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                    <span>
                      <EditableText
                        contentKey={key(`pricing.inclusions.${index}`)}
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

            <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <EditableText
                  contentKey={key("pricing.hostingHeading")}
                  value={props.hostingHeading}
                  as="span"
                  showIcon={false}
                />
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {(props.hostingItems || []).map((item, index) => {
                  const Icon = hostingIcons[index] ?? Server
                  return (
                    <div key={`${index}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Icon className="mt-0.5 h-4 w-4 text-foreground/70" aria-hidden="true" />
                      <span>
                        <EditableText
                          contentKey={key(`pricing.hostingItems.${index}`)}
                          value={normalizeItem(item)}
                          as="span"
                          showIcon={false}
                        />
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              <EditableText
                contentKey={key("pricing.complexityNote")}
                value={props.complexityNote}
                as="span"
                multiline
                showIcon={false}
              />
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary" size="sm" className="rounded-full">
                <a href={props.ctas?.primary?.href || "#booking"}>
                  <EditableText
                    contentKey={key("pricing.ctas.primary.label")}
                    value={props.ctas?.primary?.label || ""}
                    as="span"
                    showIcon={false}
                  />
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <a href={props.ctas?.secondary?.href || "mailto:hello@velvetdinosaur.com"}>
                  <EditableText
                    contentKey={key("pricing.ctas.secondary.label")}
                    value={props.ctas?.secondary?.label || ""}
                    as="span"
                    showIcon={false}
                  />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {clarifiers.map((clarifier, index) => (
            <Card key={`${clarifier.heading}-${index}`} className="border-border/70 bg-background">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  <EditableText
                    contentKey={key(`pricing.clarifiers.${index}.heading`)}
                    value={clarifier.heading}
                    as="span"
                    showIcon={false}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {(clarifier.bullets || []).map((item, bulletIndex) => (
                    <li key={`${bulletIndex}`} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                      <EditableText
                        contentKey={key(`pricing.clarifiers.${index}.bullets.${bulletIndex}`)}
                        value={normalizeItem(item)}
                        as="span"
                        showIcon={false}
                      />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <EditableText contentKey={key("pricing.vatNote")} value={props.vatNote} as="span" showIcon={false} />
        </div>
      </div>
    </Section>
  )
}

export const pricingSectionConfig: ComponentConfig<PricingSectionProps> = {
  fields: {
    heading: { type: "text" },
    subheading: { type: "textarea" },
    baseline: {
      type: "object",
      objectFields: {
        label: { type: "text" },
        price: { type: "text" },
        includesSummary: { type: "text" },
        includesNote: { type: "text" },
      },
    },
    includesHeading: { type: "text" },
    inclusions: { type: "array", arrayFields: { value: { type: "text" } } },
    hostingHeading: { type: "text" },
    hostingItems: { type: "array", arrayFields: { value: { type: "text" } } },
    complexityNote: { type: "textarea" },
    clarifiers: {
      type: "array",
      arrayFields: {
        heading: { type: "text" },
        bullets: { type: "array", arrayFields: { value: { type: "text" } } },
      },
    },
    vatNote: { type: "text" },
    ctas: {
      type: "object",
      objectFields: {
        primary: {
          type: "object",
          objectFields: {
            label: { type: "text" },
            href: { type: "text" },
          },
        },
        secondary: {
          type: "object",
          objectFields: {
            label: { type: "text" },
            href: { type: "text" },
          },
        },
      },
    },
  },
  defaultProps: {
    heading: "",
    subheading: "",
    baseline: {
      label: "",
      price: "",
      includesSummary: "",
      includesNote: "",
    },
    includesHeading: "",
    inclusions: [],
    hostingHeading: "",
    hostingItems: [],
    complexityNote: "",
    clarifiers: [],
    vatNote: "",
    ctas: {
      primary: { label: "", href: "" },
      secondary: { label: "", href: "" },
    },
  },
  render: (props) => <PricingSection {...props} />,
}
