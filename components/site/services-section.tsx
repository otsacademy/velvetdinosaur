import { ArrowRight, Clock, Code2, Globe, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ServiceCardProps {
  icon: React.ElementType
  title: string
  description: string
}

function ServiceCard({ icon: Icon, title, description }: ServiceCardProps) {
  return (
    <div className="vd-service-card vd-icon-card rounded-xl border border-transparent bg-card p-5">
      <div className="vd-icon-badge mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
        <Icon className="vd-icon-accent h-5 w-5 text-primary" />
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="text-sm text-[var(--vd-copy)]">{description}</p>
    </div>
  )
}

export function ServicesSection() {
  return (
    <section id="services" className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div className="space-y-5">
            <h2 className="vd-section-heading text-2xl font-semibold">Services</h2>

            <div className="max-w-xl space-y-4 leading-relaxed text-[var(--vd-copy)]">
              <p>
                I build bespoke websites and apps from the ground up. Some clients come with a clear brief. Others
                come with a knotty problem, an ageing site, or the start of an idea that needs shaping. I enjoy both,
                and I focus on turning that early uncertainty into something clear, useful, and well built.
              </p>
              <p>
                Each project is shaped around your goals, your users, and how your organisation actually works.
                Everything is built from scratch, so nothing is borrowed from a previous client or squeezed into
                someone else&apos;s framework.
              </p>
            </div>

            <Button asChild className="vd-dino-cta h-11 gap-2 rounded-full px-6 text-[0.9375rem] font-medium">
              <a href="#contact">
                Get in touch
                <ArrowRight className="h-4 w-4 vd-inline-arrow" />
              </a>
            </Button>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute bottom-4 left-0 top-4 w-1 rounded-full bg-primary" aria-hidden="true" />
            <div className="grid grid-cols-1 gap-4 pl-6 sm:grid-cols-2 sm:pl-8">
              <ServiceCard
                icon={Globe}
                title="Websites"
                description="Marketing sites, portfolios, blogs, and landing pages"
              />
              <ServiceCard
                icon={Smartphone}
                title="Mobile apps"
                description="iOS and Android apps with React Native"
              />
              <ServiceCard
                icon={Code2}
                title="Web apps"
                description="Custom platforms, dashboards, and SaaS products"
              />
              <ServiceCard
                icon={Clock}
                title="4-6 weeks"
                description="Typical project timeline from start to launch"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
