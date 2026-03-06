import { Check, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

type ProcessStep = {
  number: number
  title: string
  description: string
}

const packageFeatures: string[] = [
  "Custom design and build tailored to your goals, audience, and offer",
  "Up to 8 sections (single-page) or 8 standard pages mapped to your customer journey",
  "SEO-ready structure with metadata, sitemap, indexing controls, and crawlable links",
  "Performance optimisation for fast loading on both mobile and desktop",
  "Contact forms and core integrations (email, maps, and scheduling) configured and tested",
  "Launch support, handover guidance, and clear next steps after go-live",
]

const processSteps: ProcessStep[] = [
  {
    number: 1,
    title: "Discovery",
    description: "We align on goals, users, and scope before build starts.",
  },
  {
    number: 2,
    title: "Design & build",
    description: "You get iterative progress, clear checkpoints, and practical feedback loops.",
  },
  {
    number: 3,
    title: "Refinement",
    description: "We polish copy, UX details, and technical quality before launch.",
  },
  {
    number: 4,
    title: "Launch & support",
    description: "Project goes live with handover guidance and post-launch support.",
  },
]

function DeliveryStep({ number, title, description }: ProcessStep) {
  return (
    <li className="relative rounded-xl border border-border bg-card/95 p-4">
      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {number}
      </div>
      <h3 className="mb-1 text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </li>
  )
}

export function PricingSection() {
  return (
    <section id="pricing" className="py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="vd-section-heading mb-6 text-2xl font-semibold">Pricing & process</h2>

        <div className="vd-pricing-card vd-hover-lift-sm rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-card p-6 md:p-8">
          <p className="mb-3 text-sm font-medium text-foreground/80">Complete website package</p>
          <p className="mb-4 text-5xl font-bold leading-none text-foreground">£2,500</p>
          <p className="mb-6 max-w-3xl text-foreground/80">
            A fixed launch package for most small business websites. If your scope includes advanced functionality
            (for example bookings, portals, or custom integrations), it is scoped and quoted separately before build
            starts.
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Hosting is £120/year after Year 1. Domain registration is not included and can be procured at cost price.
          </p>

          <ul className="mb-8 space-y-3">
            {packageFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </span>
                <span className="text-sm text-foreground/80">{feature}</span>
              </li>
            ))}
          </ul>

          <Button asChild className="h-11 px-5">
            <a href="#contact" className="inline-flex items-center gap-2">
              Get a fixed quote for your scope
              <ChevronRight className="h-4 w-4" />
            </a>
          </Button>

          <div className="mt-8 rounded-xl border border-border bg-background/75 p-5">
            <h3 className="mb-3 text-lg font-semibold">How payments work</h3>
            <p className="mb-3 text-foreground/80">
              Projects usually start with a 20% deposit, then milestone payments tied to agreed deliverables.
            </p>
            <p className="text-muted-foreground">
              Before development starts, scope, timeline, and deliverables are documented clearly so there are no
              surprises.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Delivery process</h3>
          <div className="relative">
            <div className="absolute left-0 right-0 top-[1.05rem] hidden h-px bg-border md:block" aria-hidden="true" />
            <ol className="grid gap-4 md:grid-cols-4">
              {processSteps.map((step) => (
                <DeliveryStep key={step.number} {...step} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
