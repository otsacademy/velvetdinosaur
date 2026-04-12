import { ArrowRight, Check, ShieldCheck } from "lucide-react"

import {
  TimelineCenteredSpine,
  type TimelineCenteredSpineItem,
} from "@/components/timeline-centered-spine"
import { Badge } from "@/components/ui/badge"
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

const pricingHighlights = [
  { label: "Agency equivalent", value: "£10k-£15k" },
  { label: "Deposit", value: "20%" },
  { label: "Maintenance", value: "£120/year" },
] as const

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

        <div className="relative overflow-hidden rounded-[2rem] border border-[color-mix(in_oklch,var(--vd-border)_78%,transparent)] bg-[color-mix(in_oklch,var(--vd-muted)_42%,var(--vd-bg))] p-6 shadow-[0_24px_80px_color-mix(in_oklch,var(--vd-fg)_4%,transparent)] md:p-8 lg:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--vd-primary)_16%,transparent),transparent_58%)]"
          />

          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(16rem,0.7fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--vd-muted-fg)]">
                Simple pricing
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h3 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  All-inclusive launch package
                </h3>
                <Badge className="rounded-full bg-[hsl(204,88%,40%)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white">
                  Best value
                </Badge>
              </div>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--vd-copy)]">
                A fixed-price launch package for most professional websites. If your scope includes advanced
                functionality (for example bookings, portals, or custom integrations), it is scoped and quoted
                separately before build starts.
              </p>

              <div className="mt-8 flex flex-wrap items-end gap-3">
                <div className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">£2,500</div>
                <p className="max-w-xs pb-1 text-sm text-[var(--vd-muted-fg)]">
                  Fixed-price launch package for most professional websites.
                </p>
              </div>

              <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[var(--vd-muted-fg)]">
                An equivalent React / Next.js build at a London agency typically starts at £10k-£15k. Working
                directly with the founder means you get the same enterprise-grade stack without the agency markup.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {pricingHighlights.map((highlight) => (
                <div
                  key={highlight.label}
                  className="rounded-[1.35rem] border border-[color-mix(in_oklch,var(--vd-border)_75%,transparent)] bg-[color-mix(in_oklch,var(--vd-bg)_88%,transparent)] px-4 py-4 shadow-sm backdrop-blur"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">
                    {highlight.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{highlight.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-10 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-[1.5rem] border border-[color-mix(in_oklch,var(--vd-border)_75%,transparent)] bg-[color-mix(in_oklch,var(--vd-bg)_86%,transparent)] p-5 md:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">
                How payments work
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--vd-copy)]">
                Projects usually start with a 20% deposit, then milestone payments tied to agreed deliverables.
                Before development starts, scope, timeline, and deliverables are documented clearly so there are no
                surprises.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[color-mix(in_oklch,var(--vd-border)_75%,transparent)] bg-[color-mix(in_oklch,var(--vd-bg)_86%,transparent)] p-5 md:p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-[hsl(204,88%,40%)]" />
                Performance, security, and ownership
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--vd-copy)]">
                Performance & security maintenance is £120/year after Year 1 and includes managed hosting, monitoring,
                SSL, and daily backups. Domain registration is not included and can be procured at cost price.
              </p>
            </div>
          </div>

          <div className="relative mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-[color-mix(in_oklch,var(--vd-border)_75%,transparent)] bg-[color-mix(in_oklch,var(--vd-bg)_86%,transparent)] p-5 md:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">
                Core package scope
              </p>
              <ul className="mt-4 space-y-3">
                {packageFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--vd-primary)_12%,transparent)] text-[hsl(204,88%,40%)]">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm leading-relaxed text-[var(--vd-copy)]">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[1.5rem] border border-[color-mix(in_oklch,var(--vd-border)_75%,transparent)] bg-[color-mix(in_oklch,var(--vd-bg)_86%,transparent)] p-5 md:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">
                Launch essentials included
              </p>
              <ul className="mt-4 space-y-3">
                {launchEssentials.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--vd-primary)_12%,transparent)] text-[hsl(204,88%,40%)]">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm leading-relaxed text-[var(--vd-copy)]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative mt-8 flex flex-col gap-4 border-t border-[color-mix(in_oklch,var(--vd-border)_75%,transparent)] pt-6 md:flex-row md:items-center md:justify-between">
            <p className="max-w-xl text-sm leading-relaxed text-[var(--vd-muted-fg)]">
              Scope, timeline, and deliverables are documented before development starts so the build stays clear,
              practical, and free from avoidable surprises.
            </p>

            <Button asChild className="vd-dino-cta h-11 rounded-full px-6 text-[0.9375rem] font-medium">
              <a href="#contact" className="inline-flex items-center gap-2">
                Get a quote tailored to your scope
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
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
