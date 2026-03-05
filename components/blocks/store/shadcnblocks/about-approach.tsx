"use client"

import type { ComponentConfig } from "@measured/puck"

import { ShadcnblocksContainer } from "@/components/blocks/store/shadcnblocks/shared"
import { Button } from "@/components/ui/button"

type ApproachStep = {
  title: string
  description: string
}

export type ShadcnblocksAboutApproachProps = {
  eyebrow: string
  heading: string
  description: string
  ctaLabel: string
  ctaHref: string
  imageSrc: string
  imageAlt: string
  steps: ApproachStep[]
}

export function ShadcnblocksAboutApproach(props: ShadcnblocksAboutApproachProps) {
  return (
    <ShadcnblocksContainer>
      <section className="py-8">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {props.eyebrow}
              </p>
              <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
                {props.heading}
              </h2>
              <p className="text-lg text-muted-foreground">{props.description}</p>
              <Button asChild className="rounded-full px-6">
                <a href={props.ctaHref}>{props.ctaLabel}</a>
              </Button>
              <div className="mt-8 space-y-6">
                {(props.steps || []).map((step, index) => (
                  <div key={`${step.title}-${index}`} className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      {step.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border bg-muted">
              <img
                src={props.imageSrc}
                alt={props.imageAlt}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </ShadcnblocksContainer>
  )
}

export const shadcnblocksAboutApproachConfig: ComponentConfig<ShadcnblocksAboutApproachProps> = {
  fields: {
    eyebrow: { type: "text" },
    heading: { type: "text" },
    description: { type: "textarea" },
    ctaLabel: { type: "text" },
    ctaHref: { type: "text" },
    imageSrc: { type: "text" },
    imageAlt: { type: "text" },
    steps: {
      type: "array",
      arrayFields: {
        title: { type: "text" },
        description: { type: "textarea" },
      },
    },
  },
  defaultProps: {
    eyebrow: "Our Approach",
    heading: "Designing with clarity, building with care",
    description:
      "We pair research-driven insights with bold creative execution. From discovery to launch, every decision is made to support your goals and your audience.",
    ctaLabel: "Learn more",
    ctaHref: "#",
    imageSrc: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg",
    imageAlt: "Team collaboration",
    steps: [
      {
        title: "Discover",
        description: "Align on goals, audience, and constraints before we design.",
      },
      {
        title: "Design",
        description: "Prototype rapidly, validate with users, and iterate with intent.",
      },
      {
        title: "Deliver",
        description: "Ship with confidence and set you up for long-term growth.",
      },
    ],
  },
  render: (props) => <ShadcnblocksAboutApproach {...props} />,
}
