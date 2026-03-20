"use client"

import Link from "next/link"
import type { ComponentConfig } from "@measured/puck"
import { ArrowLeft } from "lucide-react"

import { EditableText } from "@/components/content/editable"
import { contentKey } from "@/components/content/content-keys"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getLegalIcon, normalizeListItems, normalizeStringItems, type LegalListItem, type StringItem } from "@/components/blocks/store/velvet/shared/legal-helpers"

type OverviewEyebrow = {
  icon?: string
  label?: string
}

export type LegalOverviewProps = {
  id?: string
  eyebrow: OverviewEyebrow
  title: string
  backLabel: string
  backHref: string
  lastUpdated: string
  introParagraphs: StringItem[]
  summaryHeading: string
  summaryItems: Array<LegalListItem | StringItem>
  summaryColumns?: "true" | "false"
  summarySeparator?: "true" | "false"
  extraHeading: string
  extraParagraphs: StringItem[]
  extraListItems: Array<LegalListItem | StringItem>
}

export function LegalOverview(props: LegalOverviewProps) {
  const key = (path: string) => contentKey(props.id, path)
  const EyebrowIcon = getLegalIcon(props.eyebrow?.icon)
  const introParagraphs = normalizeStringItems(props.introParagraphs)
  const summaryItems = normalizeListItems(props.summaryItems)
  const extraParagraphs = normalizeStringItems(props.extraParagraphs)
  const extraListItems = normalizeListItems(props.extraListItems)
  const showSummarySeparator = props.summarySeparator !== "false" && introParagraphs.length > 0
  const showSummary = Boolean(props.summaryHeading || summaryItems.length)
  const showExtra = Boolean(props.extraHeading || extraParagraphs.length || extraListItems.length)
  const summaryColumns = props.summaryColumns === "true"

  return (
    <section id="overview" className="scroll-mt-28">
      <Card className="rounded-2xl border bg-card">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              {props.eyebrow?.label ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {EyebrowIcon ? <EyebrowIcon className="h-4 w-4 text-primary" /> : null}
                  <EditableText
                    contentKey={key("legal.overview.eyebrowLabel")}
                    value={props.eyebrow.label}
                    as="span"
                    showIcon={false}
                  />
                </div>
              ) : null}
              <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
                <EditableText contentKey={key("legal.overview.title")} value={props.title} as="span" showIcon={false} />
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href={props.backHref} className="inline-flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <EditableText
                    contentKey={key("legal.overview.backLabel")}
                    value={props.backLabel}
                    as="span"
                    showIcon={false}
                  />
                </Link>
              </Button>
              {props.lastUpdated ? (
                <Badge variant="secondary" className="w-fit">
                  <EditableText
                    contentKey={key("legal.overview.lastUpdated")}
                    value={props.lastUpdated}
                    as="span"
                    showIcon={false}
                  />
                </Badge>
              ) : null}
            </div>
          </div>

          {introParagraphs.map((paragraph, index) => (
            <p key={index} className="text-base text-muted-foreground">
              <EditableText
                contentKey={key(`legal.overview.introParagraphs.${index}`)}
                value={paragraph}
                as="span"
                multiline
                showIcon={false}
              />
            </p>
          ))}

          {showSummarySeparator && showSummary ? <Separator /> : null}

          {showSummary ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">
                <EditableText
                  contentKey={key("legal.overview.summaryHeading")}
                  value={props.summaryHeading}
                  as="span"
                  showIcon={false}
                />
              </h2>
              <ul
                className={`list-disc space-y-2 pl-5 text-sm text-muted-foreground${summaryColumns ? " sm:columns-2" : ""}`}
              >
                {summaryItems.map((item, index) => (
                  <li key={index}>
                    {item.label ? (
                      <strong>
                        <EditableText
                          contentKey={key(`legal.overview.summaryItems.${index}.label`)}
                          value={item.label}
                          as="span"
                          showIcon={false}
                        />
                      </strong>
                    ) : null}
                    {item.label ? " " : null}
                    <EditableText
                      contentKey={key(`legal.overview.summaryItems.${index}.text`)}
                      value={item.text}
                      as="span"
                      showIcon={false}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {showExtra ? <Separator /> : null}

          {showExtra ? (
            <div className="space-y-3">
              {props.extraHeading ? (
                <h2 className="text-lg font-semibold text-foreground">
                  <EditableText
                    contentKey={key("legal.overview.extraHeading")}
                    value={props.extraHeading}
                    as="span"
                    showIcon={false}
                  />
                </h2>
              ) : null}
              {extraParagraphs.map((paragraph, index) => (
                <p key={index} className="text-sm text-muted-foreground">
                  <EditableText
                    contentKey={key(`legal.overview.extraParagraphs.${index}`)}
                    value={paragraph}
                    as="span"
                    multiline
                    showIcon={false}
                  />
                </p>
              ))}
              {extraListItems.length ? (
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {extraListItems.map((item, index) => (
                    <li key={index}>
                      {item.label ? (
                        <strong>
                          <EditableText
                            contentKey={key(`legal.overview.extraListItems.${index}.label`)}
                            value={item.label}
                            as="span"
                            showIcon={false}
                          />
                        </strong>
                      ) : null}
                      {item.label ? " " : null}
                      <EditableText
                        contentKey={key(`legal.overview.extraListItems.${index}.text`)}
                        value={item.text}
                        as="span"
                        showIcon={false}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}

export const legalOverviewConfig: ComponentConfig<LegalOverviewProps> = {
  fields: {
    eyebrow: {
      type: "object",
      objectFields: {
        icon: { type: "text" },
        label: { type: "text" },
      },
    },
    title: { type: "text" },
    backLabel: { type: "text" },
    backHref: { type: "text" },
    lastUpdated: { type: "text" },
    introParagraphs: { type: "array", arrayFields: { value: { type: "textarea" } } },
    summaryHeading: { type: "text" },
    summaryItems: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        text: { type: "textarea" },
      },
    },
    summaryColumns: {
      type: "select",
      options: [
        { label: "Single column", value: "false" },
        { label: "Two columns", value: "true" },
      ],
    },
    summarySeparator: {
      type: "select",
      options: [
        { label: "Show separator", value: "true" },
        { label: "Hide separator", value: "false" },
      ],
    },
    extraHeading: { type: "text" },
    extraParagraphs: { type: "array", arrayFields: { value: { type: "textarea" } } },
    extraListItems: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        text: { type: "textarea" },
      },
    },
  },
  defaultProps: {
    eyebrow: {
      icon: "",
      label: "",
    },
    title: "",
    backLabel: "",
    backHref: "",
    lastUpdated: "",
    introParagraphs: [],
    summaryHeading: "",
    summaryItems: [],
    summaryColumns: "false",
    summarySeparator: "true",
    extraHeading: "",
    extraParagraphs: [],
    extraListItems: [],
  },
  render: (props) => <LegalOverview {...props} />,
}
