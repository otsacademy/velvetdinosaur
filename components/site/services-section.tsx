import { Globe, Smartphone, Code2, Clock } from "lucide-react"

interface ServiceCardProps {
  icon: React.ElementType
  title: string
  description: string
}

function ServiceCard({ icon: Icon, title, description }: ServiceCardProps) {
  return (
    <div className="vd-hover-lift-sm vd-icon-card rounded-xl border border-border bg-card p-4">
      <div className="vd-icon-badge mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="vd-icon-accent h-4 w-4 text-primary" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function ServicesSection() {
  return (
    <section id="services" className="py-8 md:py-10">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="vd-section-heading mb-6 text-2xl font-semibold">Services</h2>

        <div className="max-w-3xl space-y-5 text-muted-foreground">
          <p className="text-lg text-foreground">
            I build bespoke websites and apps from the ground up.
          </p>
          <p>
            Some clients come to me with a clear vision. Others come with the start of an
            idea that needs shaping. I enjoy both. I love solving problems, building things
            from nothing, and turning ideas into products that are useful, beautiful, and
            built to last.
          </p>
          <p>
            I do not use generic templates or off-the-shelf page builders. Every project is
            designed around your goals, your users, and the way your business works. Whether
            you need a website, a mobile app, or a custom digital product, I build around
            what you actually need rather than forcing you into a one-size-fits-all solution.
          </p>
          <p>
            For me, development is not just about code. It is also about communication,
            service, and trust. I want the process to feel collaborative from start to
            finish, and I care about delivering work that makes clients genuinely happy.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            title="4–6 weeks"
            description="Typical project timeline from start to launch"
          />
        </div>
      </div>
    </section>
  )
}
