"use client"

import type { ComponentConfig } from "@measured/puck"

import { TrustStrip } from "@/components/blocks/store/velvet/shared/trust-strip"

type StringItem = string | { value?: string }

export type TrustStripSectionProps = {
  id?: string
  items: StringItem[]
  verifiedLabel: string
  showVerifiedBadge?: "true" | "false"
}

export function TrustStripSection(props: TrustStripSectionProps) {
  return (
    <section className="py-8">
      <TrustStrip
        contentId={props.id}
        items={props.items || []}
        verifiedLabel={props.verifiedLabel}
        showVerifiedBadge={props.showVerifiedBadge}
      />
    </section>
  )
}

export const trustStripSectionConfig: ComponentConfig<TrustStripSectionProps> = {
  fields: {
    items: {
      type: "array",
      arrayFields: {
        value: { type: "text" },
      },
    },
    verifiedLabel: { type: "text" },
    showVerifiedBadge: {
      type: "select",
      options: [
        { label: "Show", value: "true" },
        { label: "Hide", value: "false" },
      ],
    },
  },
  defaultProps: {
    items: [],
    verifiedLabel: "",
    showVerifiedBadge: "true",
  },
  render: (props) => <TrustStripSection {...props} />,
}
