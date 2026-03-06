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
    description:
      "We align on goals, users, scope, and success criteria before build starts.",
  },
  {
    number: 2,
    title: "Design & build",
    description:
      "You get iterative progress, clear checkpoints, and structured feedback rounds.",
  },
  {
    number: 3,
    title: "Refinement",
    description:
      "We polish content, UX, and technical details so launch quality is dependable.",
  },
  {
    number: 4,
    title: "Launch & support",
    description:
      "The project goes live with post-launch support and clear next steps.",
  },
]

function DeliveryStep({ number, title, description }: ProcessStep) {
  return (
    <article className="vd-process-step vd-hover-lift-sm rounded-xl border border-border bg-card p-5">
      <div className="vd-step-dot mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
        {number}
      </div>
      <h3 className="mb-1 font-medium text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </article>
  )
}

export function PricingSection() {
  return (
    <section id="pricing" className="py-8 md:py-10">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="vd-section-heading mb-6 text-2xl font-semibold">Pricing & process</h2>

        <div className="vd-pricing-card vd-hover-lift-sm rounded-2xl border border-border bg-card p-6 md:p-8">
          <p className="mb-3 text-sm text-muted-foreground">Complete website package</p>
          <p className="mb-4 text-5xl font-bold leading-none text-foreground">£2,500</p>
          <p className="mb-6 text-muted-foreground">
            A fixed launch package for most small business websites. If your scope
            includes advanced functionality (for example bookings, portals, or
            custom integrations), it is scoped and quoted separately before build
            starts.
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Hosting is £120/year after Year 1. Domain registration is not included
            and can be procured at cost price.
          </p>

          <ul className="mb-8 space-y-3">
            {packageFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                  <Check className="h-3.5 w-3.5 text-foreground" />
                </span>
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <Button asChild>
            <a href="#contact" className="inline-flex items-center gap-2">
              Get a fixed quote for your scope
              <ChevronRight className="h-4 w-4" />
            </a>
          </Button>

          <div className="mt-8 rounded-xl border border-border bg-background/60 p-5">
            <h3 className="mb-3 text-lg font-semibold">How payments work</h3>
            <p className="mb-3 text-muted-foreground">
              Projects usually start with a 20% deposit, then milestone payments
              tied to agreed deliverables.
            </p>
            <p className="text-muted-foreground">
              Before development starts, scope, timeline, and deliverables are
              documented clearly so there are no surprises.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-4 text-lg font-semibold">Delivery process</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step) => (
              <DeliveryStep key={step.number} {...step} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
