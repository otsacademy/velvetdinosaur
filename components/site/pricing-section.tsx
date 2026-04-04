import { Check, ChevronRight } from "lucide-react"

import {
  TimelineCenteredSpine,
  type TimelineCenteredSpineItem,
} from "@/components/timeline-centered-spine"
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

const processSteps: TimelineCenteredSpineItem[] = [
  {
    id: "discovery",
    phase: "01",
    window: "Week 1",
    category: "Discovery",
    title: "Discovery and scope alignment",
    description:
      "We align on goals, users, and scope before build starts so priorities are clear and delivery stays focused.",
    details:
      "We review your goals, audience, offer, content needs, and any integrations up front, then turn that into an agreed scope so the rest of the build moves without guesswork.",
    proof: "Clear scope before build starts",
  },
  {
    id: "design-build",
    phase: "02",
    window: "Weeks 2-3",
    category: "Build",
    title: "Design and build in active sprints",
    description:
      "You get iterative progress updates, practical feedback loops, and visible momentum as core pages and flows come together.",
    details:
      "I build in working sections rather than disappearing for weeks. You see progress early, respond to practical questions quickly, and keep decisions moving while the structure and design take shape.",
    proof: "Visible progress every week",
  },
  {
    id: "refinement",
    phase: "03",
    window: "Week 4",
    category: "Refinement",
    title: "Refinement and quality pass",
    description:
      "We polish UX details, tighten copy, and complete technical quality checks to ensure the site is fast, stable, and conversion-ready.",
    details:
      "This is where content flow, mobile spacing, performance, accessibility, and conversion details get tightened so the finished site feels intentional rather than merely assembled.",
    proof: "Quality gates before launch",
  },
  {
    id: "launch-support",
    phase: "04",
    window: "Weeks 5-6",
    category: "Launch",
    title: "Launch with guided handover",
    description:
      "The project goes live with post-launch support and clear handover guidance so you can manage content confidently after release.",
    details:
      "I handle the launch and stay close through handover so domains, content updates, and next-step questions do not become your problem the moment the site goes live.",
    proof: "Launch support and handover included",
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-8">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="vd-section-heading mb-6 text-2xl font-semibold">Pricing & process</h2>

        <div className="vd-surface-panel vd-soft-panel p-6 md:p-8">
          <p className="mb-3 text-sm font-medium text-[var(--vd-muted-fg)]">Bespoke website package</p>
          <p className="mb-4 text-5xl font-bold leading-none text-foreground">
            <span className="mb-[2px] block text-[0.45em] font-medium tracking-[0.02em] opacity-70">from</span>
            £2,500
          </p>
          <p className="mb-6 max-w-3xl text-[var(--vd-copy)]">
            A fixed-price launch package for most professional websites. If your scope includes advanced functionality
            (for example bookings, portals, or custom integrations), it is scoped and quoted separately before build
            starts.
          </p>
          <p className="mb-6 max-w-3xl text-sm italic text-[var(--vd-muted-fg)]">
            An equivalent React / Next.js build at a London agency typically starts at £10k-£15k. Working directly
            with the founder means you get the same enterprise-grade stack without the agency markup.
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
            Performance & security maintenance is £120/year after Year 1 and includes managed hosting, monitoring,
            SSL, and daily backups. Domain registration is not included and can be procured at cost price.
          </p>

          <Button asChild className="vd-dino-cta h-11 rounded-full px-6 text-[0.9375rem] font-medium">
            <a href="#contact" className="inline-flex items-center gap-2">
              Get a quote tailored to your scope
              <ChevronRight className="h-4 w-4 vd-inline-arrow" />
            </a>
          </Button>
        </div>

        <div className="mt-9">
          <TimelineCenteredSpine
            heading="Delivery process"
            summary="A founder-led build process with clear checkpoints, practical feedback loops, and a proper handover at the end."
            rangeLabel="Week 1 to Week 6"
            items={processSteps}
          />
        </div>
      </div>
    </section>
  )
}
