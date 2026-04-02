import type { ElementType } from "react"
import Image from "next/image"
import { ArrowRight, Handshake, Star } from "lucide-react"

import { ShadcnblocksService5 } from "@/components/blocks/store/shadcnblocks/service5"
import { Button } from "@/components/ui/button"
import { r2PublicUrl } from "@/lib/public-assets"

interface StatCardProps {
  icon: ElementType
  eyebrow: string
  title: string
  description: string
}

const statCards: StatCardProps[] = [
  {
    icon: Handshake,
    eyebrow: "Approach",
    title: "Direct from first call to launch",
    description:
      "You work with me throughout. No handoffs, no templates, and no platform lock-in at the end.",
  },
  {
    icon: Star,
    eyebrow: "Proof",
    title: "5.0 Google rating",
    description:
      "Independent reviews from clients who trusted Velvet Dinosaur with redesigns, migrations, and full builds.",
  },
]

function StatCard({ icon: Icon, eyebrow, title, description }: StatCardProps) {
  return (
    <article className="vd-as-stat-card rounded-[1.25rem] border border-[color-mix(in_oklch,var(--vd-border)_82%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_94%,var(--vd-bg))] p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--vd-dino-blue)_18%,transparent)] bg-[color-mix(in_oklch,var(--vd-dino-blue)_9%,transparent)] text-[var(--vd-dino-blue)]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
      <h4 className="mt-2 text-base font-semibold tracking-tight text-foreground">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-[var(--vd-copy)]">{description}</p>
    </article>
  )
}

export function AboutServicesSection() {
  return (
    <section id="about-services" className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="space-y-10">
          <div className="space-y-4">
            <p className="vd-section-kicker">About & services</p>
            <h2 className="vd-as-title">Founder-led websites and apps, built carefully and handed over properly.</h2>
            <p className="vd-as-subtitle text-[var(--vd-copy)]">
              I build bespoke digital work for businesses, charities, and organisations that need something clearer
              than an off-the-shelf platform and more durable than a quick patch job.
            </p>
          </div>

          <div id="about" className="scroll-mt-28">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="space-y-4 lg:order-1 lg:col-span-1 lg:pt-14">
                {statCards.map((card) => (
                  <StatCard key={card.eyebrow} {...card} />
                ))}
              </div>

              <div className="space-y-6 lg:order-2 lg:col-span-2">
                <h3 className="vd-as-prose-heading vd-section-heading text-xl">About me</h3>

                <div className="space-y-5 text-[var(--vd-copy)]">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div
                      className="vd-about-photo-card vd-hover-lift-sm w-[104px] min-w-[104px] overflow-hidden rounded-full border border-border/70 bg-card p-1"
                      style={{ borderRadius: "9999px" }}
                    >
                      <div
                        className="relative aspect-square w-full overflow-hidden rounded-full"
                        style={{ borderRadius: "9999px" }}
                      >
                        <Image
                          src={r2PublicUrl("profile.webp")}
                          alt="Ian Wickens"
                          fill
                          sizes="104px"
                          priority
                          fetchPriority="high"
                          className="vd-about-photo-image rounded-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      <h4 className="text-xl font-semibold tracking-tight text-foreground">Ian Wickens</h4>
                      <p className="text-foreground">
                        Based in Minster Lovell, I build bespoke websites and mobile apps for organisations that want something carefully made and uniquely theirs.
                      </p>
                    </div>
                  </div>

                  <p>
                    Most of my professional career was spent in the NHS working across specialist medical devices, clinical research, and governance. That environment taught me how to work through complex problems, communicate clearly, and handle critical work with absolute care—standards I now bring to every digital project.
                  </p>
                  <p>
                    Alongside my NHS work, I spent years building sites independently: rebuilding charity platforms, coding conference websites, and figuring out how the web really works under the hood. I love what I do, and I build each project with the same passion and curiosity as the first.
                  </p>
                  <p>
                    Velvet Dinosaur grew naturally out of that experience. When we work together, you deal directly with me from our first conversation to launch. No templates. No page builders. No borrowed frameworks squeezed to fit the wrong brief. Just clean code and design built entirely for you.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div id="services" className="scroll-mt-28 space-y-6">
            <ShadcnblocksService5
              eyebrow="Services"
              headerIcon="Layout"
              headerIconSrc=""
              headerIconAlt="Velvet Dinosaur services"
              title="Projects shaped around your goals, your users, and how your organisation actually works."
              intro="Some clients arrive with a clear brief. Others come with an ageing site, a knotty internal problem, or the start of an idea that still needs shaping. I enjoy both, and I focus on turning that early uncertainty into something clear, useful, and well built."
              sections={[
                {
                  heading: "How the work takes shape",
                  paragraphs: [
                    "Each project is scoped around what the organisation actually needs, not around a recycled package or a previous client template.",
                    "That means aligning the structure, functionality, and content model with your goals from the start, then building it cleanly enough that it stays maintainable after launch.",
                  ],
                  bullets: [],
                },
                {
                  heading: "What I typically build",
                  paragraphs: [],
                  bullets: [
                    "Websites: Marketing sites, portfolios, blogs, and landing pages designed to convert cleanly.",
                    "Mobile apps: React Native apps for iOS and Android when the project needs more than the browser.",
                    "Web apps: Custom products, dashboards, member areas, and internal tools shaped around your workflow.",
                  ],
                },
              ]}
              expertiseTitle="Why clients hire me"
              stats={[
                {
                  icon: "Briefcase",
                  title: "Founder-led delivery",
                  description: "You work with me directly from discovery to launch.",
                },
                {
                  icon: "Handshake",
                  title: "Bespoke scope",
                  description: "The build is shaped around your business rather than squeezed into a stock format.",
                },
                {
                  icon: "Clock",
                  title: "4 to 6 weeks",
                  description: "Typical brochure-style project timeline from first call to launch.",
                },
              ]}
              relatedTitle="Project types"
              relatedServices={[
                {
                  icon: "Globe",
                  title: "Websites",
                  description: "Fast brochure sites, portfolios, editorial sites, and campaign landing pages.",
                  href: "#contact",
                },
                {
                  icon: "Smartphone",
                  title: "Mobile apps",
                  description: "React Native builds for teams who need iOS and Android without two codebases.",
                  href: "#contact",
                },
                {
                  icon: "Code",
                  title: "Web apps",
                  description: "Member areas, custom platforms, admin tools, dashboards, and product MVPs.",
                  href: "#contact",
                },
              ]}
              sectionClassName="py-0"
              titleTag="h3"
              titleClassName="vd-as-section-heading text-2xl md:text-3xl lg:text-[2.5rem]"
              introClassName="text-base leading-7 text-[var(--vd-copy)]"
              proseClassName="prose-headings:font-semibold prose-headings:tracking-[-0.01em] prose-headings:text-foreground prose-p:text-[var(--vd-copy)] prose-li:text-[var(--vd-copy)] prose-ul:space-y-2"
              sidebarCardClassName="rounded-[1.25rem] border border-[color-mix(in_oklch,var(--vd-border)_82%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_94%,var(--vd-bg))]"
            />

            <Button asChild className="vd-dino-cta h-12 gap-2 rounded-full px-7 text-[0.9375rem] font-medium">
              <a href="#contact">
                Start your project
                <ArrowRight className="h-4 w-4 vd-inline-arrow" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
