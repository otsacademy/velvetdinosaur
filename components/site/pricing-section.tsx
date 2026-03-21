import { Check, ChevronRight } from "lucide-react"

import { Timeline12, type Timeline12Item } from "@/components/timeline12"
import { Button } from "@/components/ui/button"

const packageFeatures: string[] = [
  "Custom design and build tailored to your goals, audience, and offer.",
  "Up to 8 sections (single-page) or 8 standard pages mapped to your customer journey.",
  "SEO-ready structure with metadata, sitemap, indexing controls, and crawlable links.",
  "Performance optimisation for fast loading on mobile and desktop.",
  "Contact forms and core integrations (email, maps, and scheduling) configured and tested.",
  "Launch support, handover guidance, and clear next steps after go-live.",
]

const launchEssentials: string[] = [
  "Managed hosting and monitoring",
  "SSL security and daily off-site backups",
  "Email setup and DNS configuration",
  "Support portal access",
  "Domain migration support",
  "Full ownership of your domain, content, and website files",
]

const processSteps: Timeline12Item[] = [
  {
    id: "discovery",
    phase: "01",
    title: "Discovery",
    date: "Week 1",
    heading: "Discovery and scope alignment",
    description:
      "We align on goals, users, and scope before build starts so priorities are clear and delivery stays focused.",
    imageSrc: "/portfolio/asap.png",
    imageAlt: "Discovery phase example from a live client website",
  },
  {
    id: "design-build",
    phase: "02",
    title: "Design & build",
    date: "Weeks 2-3",
    heading: "Design and build in active sprints",
    description:
      "You get iterative progress updates, practical feedback loops, and visible momentum as core pages and flows come together.",
    imageSrc: "/portfolio/the-brave.png",
    imageAlt: "Design and build phase example from a live client website",
  },
  {
    id: "refinement",
    phase: "03",
    title: "Refinement",
    date: "Week 4",
    heading: "Refinement and quality pass",
    description:
      "We polish UX details, tighten copy, and complete technical quality checks to ensure the site is fast, stable, and conversion-ready.",
    imageSrc: "/portfolio/rising-dust.png",
    imageAlt: "Refinement phase example from a completed website",
  },
  {
    id: "launch-support",
    phase: "04",
    title: "Launch & support",
    date: "Weeks 5-6",
    heading: "Launch with guided handover",
    description:
      "The project goes live with post-launch support and clear handover guidance so you can manage content confidently after release.",
    imageSrc: "/portfolio/scholardemia.png",
    imageAlt: "Launch and support phase example from a production platform",
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="vd-section-heading mb-6 text-2xl font-semibold">Pricing & process</h2>

        <div className="vd-surface-panel vd-soft-panel p-6 md:p-8">
          <p className="mb-3 text-sm font-medium text-[var(--vd-muted-fg)]">Complete website package</p>
          <p className="mb-4 text-5xl font-bold leading-none text-foreground">£2,500</p>
          <p className="mb-6 max-w-3xl text-[var(--vd-copy)]">
            A fixed launch package for most small business websites. If your scope includes advanced functionality
            (for example bookings, portals, or custom integrations), it is scoped and quoted separately before build
            starts.
          </p>

          <div className="mb-6 border-l-2 border-[color-mix(in_oklch,var(--vd-primary)_35%,var(--vd-border))] pl-4">
            <h3 className="mb-2 text-lg font-semibold text-foreground">How payments work</h3>
            <p className="text-sm text-[var(--vd-muted-fg)]">
              Projects usually start with a 20% deposit, then milestone payments tied to agreed deliverables. Before
              development starts, scope, timeline, and deliverables are documented clearly so there are no surprises.
            </p>
          </div>

          <div className="mb-8 space-y-3">
            <h3 className="text-lg font-semibold">Core package scope</h3>
            <ul className="space-y-3">
              {packageFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <span className="text-sm text-[var(--vd-copy)]">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-8 space-y-3">
            <h3 className="text-lg font-semibold">Launch essentials included</h3>
            <ul className="grid gap-3 md:grid-cols-2">
              {launchEssentials.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <span className="text-sm text-[var(--vd-copy)]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mb-6 text-sm text-[var(--vd-muted-fg)]">
            Hosting is £120/year after Year 1. Domain registration is not included and can be procured at cost price.
          </p>

          <Button asChild className="vd-email-cta vd-pill-primary h-11 rounded-full px-6 text-[0.9375rem] font-medium">
            <a href="#contact" className="inline-flex items-center gap-2">
              Get a fixed quote for your scope
              <ChevronRight className="h-4 w-4 vd-inline-arrow" />
            </a>
          </Button>
        </div>

        <div className="mt-9">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Delivery process</h3>
          <Timeline12 items={processSteps} />
        </div>
      </div>
    </section>
  )
}
