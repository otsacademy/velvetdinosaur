"use client"

import { useState } from "react"
import type { ComponentConfig } from "@measured/puck"
import { Check, Shield } from "lucide-react"

import { EditableText } from "@/components/content/editable"
import { contentKey } from "@/components/content/content-keys"
import { Section, SectionHeading } from "@/components/ui/section"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

type StringItem = string | { value?: string }

type EditingPreview = {
  videoSrc?: string
  posterSrc?: string
  fallbackHeading?: string
  fallbackBullets?: StringItem[]
  fallbackNote?: string
  ariaLabel?: string
}

type EditingSafetyNet = {
  title?: string
  description?: string
}

export type EditingSectionProps = {
  id?: string
  heading: string
  subheading: string
  editableHeading: string
  editableItems: StringItem[]
  preview: EditingPreview
  safetyNet: EditingSafetyNet
}

function normalizeItems(items: StringItem[] | undefined) {
  return (items || [])
    .map((item) => (typeof item === "string" ? item : item?.value))
    .filter((item): item is string => Boolean(item))
}

export function EditingSection(props: EditingSectionProps) {
  const key = (path: string) => contentKey(props.id, path)
  const [mediaError, setMediaError] = useState(false)
  const preview = props.preview || {}
  const canShowVideo = Boolean(preview.videoSrc) && !mediaError
  const editableItems = normalizeItems(props.editableItems)
  const fallbackBullets = normalizeItems(preview.fallbackBullets)

  return (
    <Section id="editing" className="bg-background">
      <div className="max-w-3xl mx-auto text-center">
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
              <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
              <path d="m15 5 4 4" />
            </svg>
            <EditableText contentKey={key("editing.heading")} value={props.heading} as="span" showIcon={false} />
          </span>
        </SectionHeading>
        <p className="text-lg text-muted-foreground mb-6 md:mb-8">
          <EditableText
            contentKey={key("editing.subheading")}
            value={props.subheading}
            as="span"
            multiline
            showIcon={false}
          />
        </p>
      </div>
      <div className="grid gap-6 max-w-5xl mx-auto md:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          <Card className="bg-background border-border">
            <CardHeader>
              <CardTitle className="text-lg">
                <EditableText
                  contentKey={key("editing.editableHeading")}
                  value={props.editableHeading}
                  as="span"
                  showIcon={false}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {editableItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">
                      <EditableText
                        contentKey={key(`editing.editableItems.${index}`)}
                        value={item}
                        as="span"
                        showIcon={false}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-background border-border">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-primary flex-shrink-0" />
                <div>
                  <CardTitle className="text-lg mb-2">
                    <EditableText
                      contentKey={key("editing.safetyNet.title")}
                      value={props.safetyNet?.title || ""}
                      as="span"
                      showIcon={false}
                    />
                  </CardTitle>
                  <p className="text-muted-foreground">
                    <EditableText
                      contentKey={key("editing.safetyNet.description")}
                      value={props.safetyNet?.description || ""}
                      as="span"
                      multiline
                      showIcon={false}
                    />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-4 md:p-5">
          {canShowVideo ? (
            <div className="relative aspect-video overflow-hidden rounded-xl bg-background">
              <video
                src={preview.videoSrc}
                poster={preview.posterSrc}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                onError={() => setMediaError(true)}
                className="h-full w-full object-cover"
                aria-label={preview.ariaLabel || "Editing preview"}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[16rem] flex-col justify-between rounded-xl bg-background p-5">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  <EditableText
                    contentKey={key("editing.preview.fallbackHeading")}
                    value={preview.fallbackHeading || ""}
                    as="span"
                    showIcon={false}
                  />
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {fallbackBullets.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                      <EditableText
                        contentKey={key(`editing.preview.fallbackBullets.${index}`)}
                        value={item}
                        as="span"
                        showIcon={false}
                      />
                    </li>
                  ))}
                </ul>
              </div>
              {preview.fallbackNote ? (
                <p className="text-xs text-muted-foreground">
                  <EditableText
                    contentKey={key("editing.preview.fallbackNote")}
                    value={preview.fallbackNote}
                    as="span"
                    showIcon={false}
                  />
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}

export const editingSectionConfig: ComponentConfig<EditingSectionProps> = {
  fields: {
    heading: { type: "text" },
    subheading: { type: "textarea" },
    editableHeading: { type: "text" },
    editableItems: { type: "array", arrayFields: { value: { type: "text" } } },
    preview: {
      type: "object",
      objectFields: {
        videoSrc: { type: "text" },
        posterSrc: { type: "text" },
        fallbackHeading: { type: "text" },
        fallbackBullets: { type: "array", arrayFields: { value: { type: "text" } } },
        fallbackNote: { type: "text" },
        ariaLabel: { type: "text" },
      },
    },
    safetyNet: {
      type: "object",
      objectFields: {
        title: { type: "text" },
        description: { type: "textarea" },
      },
    },
  },
  defaultProps: {
    heading: "",
    subheading: "",
    editableHeading: "",
    editableItems: [],
    preview: {
      videoSrc: "",
      posterSrc: "",
      fallbackHeading: "",
      fallbackBullets: [],
      fallbackNote: "",
      ariaLabel: "",
    },
    safetyNet: {
      title: "",
      description: "",
    },
  },
  render: (props) => <EditingSection {...props} />,
}
