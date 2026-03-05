"use client"

import type { ComponentConfig } from "@measured/puck"
import { HelpCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { ShadcnblocksContainer } from "@/components/blocks/store/shadcnblocks/shared"
import { GlowingEffect } from "@/components/ui/glowing-effect"

type FeatureItem = {
  title: string
  description: string
  badgeTitle: string
  image: string
  imageAlt: string
  gridClass: string
}

export type ShadcnblocksFeature284Props = {
  items: FeatureItem[]
}

export function ShadcnblocksFeature284(props: ShadcnblocksFeature284Props) {
  const items = props.items || []

  return (
    <ShadcnblocksContainer>
      <section className="h-full overflow-hidden py-8">
        <div className="container flex h-full w-full items-center justify-center">
          <div className="grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {items.map((feature, index) => (
              <div
                key={`${feature.title}-${index}`}
                className={cn(
                  "relative flex flex-col gap-2 rounded-3xl border p-4",
                  feature.gridClass,
                )}
              >
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                />
                <div className="flex w-full items-center justify-between">
                  <p className="text-muted-foreground">{feature.badgeTitle}</p>
                  <HelpCircle className="size-4 text-muted-foreground" />
                </div>
                <div className="w-full flex-1 overflow-hidden rounded-3xl bg-muted">
                  <img
                    src={feature.image}
                    alt={feature.imageAlt}
                    className="pointer-events-none h-full w-full object-cover"
                  />
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ShadcnblocksContainer>
  )
}

export const shadcnblocksFeature284Config: ComponentConfig<ShadcnblocksFeature284Props> = {
  fields: {
    items: {
      type: "array",
      arrayFields: {
        title: { type: "text" },
        description: { type: "textarea" },
        badgeTitle: { type: "text" },
        image: { type: "text" },
        imageAlt: { type: "text" },
        gridClass: { type: "text" },
      },
    },
  },
  defaultProps: {
    items: [
      {
        title: "Quality",
        description: "Lorem ipsum dolor sit amet consec adipisicing elit. Quisquam, quos.",
        badgeTitle: "#1 Block",
        image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/guri3/img1.jpeg",
        imageAlt: "Quality feature",
        gridClass: "md:col-span-1",
      },
      {
        title: "Innovation",
        description:
          "Consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore. Lorem ipsum dolor sit amet consec adipisicing elit.",
        badgeTitle: "#2 Block",
        image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/guri3/img7.jpeg",
        imageAlt: "Innovation feature",
        gridClass: "lg:col-span-2",
      },
      {
        title: "Performance",
        description: "Ut enim ad minim veniam quis nostrud exercitation ullamco laboris.",
        badgeTitle: "#3 Block",
        image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/guri3/img11.jpeg",
        imageAlt: "Performance feature",
        gridClass: "md:col-span-1 lg:row-span-2",
      },
      {
        title: "Innovation",
        description:
          "Consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore. Lorem ipsum dolor sit amet consec adipisicing elit.",
        badgeTitle: "#2 Block",
        image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/guri3/img2.jpeg",
        imageAlt: "Innovation highlight",
        gridClass: "lg:col-span-2",
      },
      {
        title: "Reliability",
        description: "Duis aute irure dolor in reprehenderit in voluptate velit esse.",
        badgeTitle: "#4 Block",
        image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/guri3/img4.jpeg",
        imageAlt: "Reliability feature",
        gridClass: "md:col-span-1",
      },
    ],
  },
  render: (props) => <ShadcnblocksFeature284 {...props} />,
}
