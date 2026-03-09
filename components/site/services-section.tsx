import { ArrowRight, Clock, Code2, Globe, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ServiceCardProps {
  icon: React.ElementType
  title: string
  description: string
}

function ServiceCard({ icon: Icon, title, description }: ServiceCardProps) {
  return (
    <div className="vd-hover-lift-sm vd-icon-card rounded-xl border border-border bg-card p-5">
      <div className="vd-icon-badge mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
        <Icon className="vd-icon-accent h-5 w-5 text-primary" />
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function ServicesSection() {
  return (
    <section id="services" className="py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div className="space-y-5">
            <h2 className="vd-section-heading text-2xl font-semibold">Services</h2>

            <div className="max-w-xl space-y-4 leading-relaxed text-muted-foreground">
              <p>
                I build bespoke websites and apps from the ground up. Some clients come to me with a clear vision;
                others come with the start of an idea that needs shaping. I enjoy both, and I focus on turning rough
                concepts into digital products that are useful, beautiful, and built to last.
              </p>
              <p>
                I do not use generic templates or off-the-shelf page builders. Every project is designed around your
                goals, your users, and how your business actually works, with direct communication and trust from
                kickoff to launch.
              </p>
            </div>

            <Button asChild className="vd-email-cta h-11 gap-2 px-5 text-base font-semibold">
              <a href="#contact">
                Get in touch
                <ArrowRight className="h-4 w-4" />
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
