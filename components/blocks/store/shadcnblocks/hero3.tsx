"use client"

import type { ComponentConfig } from "@measured/puck"

import { Hero3, type Hero3Props } from "@/components/hero3"
import { siteContent } from "@/scripts/_reference/velvet/content"

type Hero3BlockProps = Hero3Props

export function ShadcnblocksHero3(props: Hero3BlockProps) {
  return <Hero3 {...props} />
}

export const shadcnblocksHero3Config: ComponentConfig<Hero3BlockProps> = {
  fields: {
    headline: { type: "text" },
    subheadline: { type: "textarea" },
    primaryAction: {
      type: "object",
      objectFields: {
        label: { type: "text" },
        href: { type: "text" },
      },
    },
    secondaryAction: {
      type: "object",
      objectFields: {
        label: { type: "text" },
        href: { type: "text" },
      },
    },
    trustLogos: {
      type: "array",
      arrayFields: {
        name: { type: "text" },
        logo: { type: "text" },
      },
    },
  },
  defaultProps: {
    headline: siteContent.hero.headline,
    subheadline: siteContent.hero.subheadline,
    primaryAction: {
      label: siteContent.hero.primaryCta,
      href: "#booking",
    },
    secondaryAction: {
      label: siteContent.hero.secondaryCta,
      href: "#pricing",
    },
    trustLogos: siteContent.trustedBy.items.map((item: { name: string; href?: string; logo?: string }) => ({
      name: item.name,
      logo: item.logo,
    })),
  },
  render: (props) => <ShadcnblocksHero3 {...props} />,
}
