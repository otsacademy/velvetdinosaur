import { Briefcase, Clock, Code, Globe, Search, Smartphone, Star } from "lucide-react"

const whyHireMe = [
  {
    icon: Briefcase,
    title: "Founder-led delivery",
    description: "You work directly with me from discovery to launch. No account managers, no hand-offs, and no agency runaround.",
  },
  {
    icon: Search,
    title: "Rigorous problem-solving",
    description: "Drawing on my background in NHS clinical governance and medical devices, I treat complex digital builds with absolute care, security, and precision.",
  },
  {
    icon: Clock,
    title: "Predictable timelines",
    description: "Rapid 4 to 6-week turnarounds for brochure websites, and clear, structured milestones for complex mobile and web apps.",
  },
]

const projectTypes = [
  {
    icon: Globe,
    title: "Websites",
    description: "High-performance marketing sites, portfolios, editorial platforms, and landing pages designed to convert cleanly.",
  },
  {
    icon: Smartphone,
    title: "Mobile apps",
    description: "Bespoke React Native builds for teams who need seamless iOS and Android applications without the headache of managing two codebases.",
  },
  {
    icon: Code,
    title: "Web apps",
    description: "Custom products, member areas, secure admin tools, dashboards, and scalable product MVPs tailored to your workflow.",
  },
]

export function ServicesSection() {
  return (
    <section
      id="services"
      className="border-t border-[color-mix(in_oklch,var(--vd-fg)_5%,transparent)] pt-14 pb-12"
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="vd-as-title mb-4">Custom digital products, shaped around your goals.</h2>

        <div className="mb-10 grid gap-10 lg:grid-cols-[1fr_280px] lg:items-start">
          <div className="max-w-[42rem]">
            <p className="text-[0.9375rem] leading-[1.8] text-[var(--vd-copy)]">
              Whether you arrive with a clear brief, an ageing platform, or a knotty internal problem that needs
              untangling, I build solutions mapped exactly to how your organisation works. No recycled packages.
              No forced templates. Just bespoke architecture, clean code, and digital products that stay
              maintainable long after launch.
            </p>
          </div>
          <div className="flex items-start gap-3 pt-2 lg:pt-2">
            <Star className="mt-0.5 h-5 w-5 shrink-0 text-[var(--vd-primary)]" />
            <div>
              <p className="text-sm font-semibold text-foreground">5.0 Google rating</p>
              <p className="mt-1 text-sm leading-[1.6] text-muted-foreground">
                Independent reviews from clients who trusted Velvet Dinosaur with redesigns, migrations, and full builds.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-12 border-t border-[color-mix(in_oklch,var(--vd-fg)_8%,transparent)] pt-8 lg:grid-cols-2">
          {/* Column 1: Why clients hire me */}
          <div>
            <h3 className="mb-6 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-foreground/70">
              Why clients hire me
            </h3>
            <div className="space-y-7">
              {whyHireMe.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 border-l-2 border-transparent pl-3 transition-colors duration-200 [transition-timing-function:var(--vd-hover-ease)] hover:border-[color-mix(in_oklch,var(--vd-primary)_35%,transparent)]"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vd-primary)]" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-[0.875rem] leading-[1.72] [color:color-mix(in_oklch,var(--vd-copy)_78%,var(--vd-bg))]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Column 2: Project types */}
          <div>
            <h3 className="mb-6 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-foreground/70">
              Project types
            </h3>
            <div className="space-y-7">
              {projectTypes.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 border-l-2 border-transparent pl-3 transition-colors duration-200 [transition-timing-function:var(--vd-hover-ease)] hover:border-[color-mix(in_oklch,var(--vd-primary)_35%,transparent)]"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vd-primary)]" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-[0.875rem] leading-[1.72] [color:color-mix(in_oklch,var(--vd-copy)_78%,var(--vd-bg))]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
