import { Briefcase, CalendarClock, Clock, Globe, LayoutDashboard, Search, Star } from "lucide-react"

const whyHireMe = [
  {
    icon: Briefcase,
    title: "Founder-led delivery",
    description: "You work directly with me from first conversation to launch and beyond. No account managers, no hand-offs, and no agency runaround.",
  },
  {
    icon: Search,
    title: "Rigorous problem-solving",
    description: "Drawing on my background in NHS clinical governance and medical devices, I treat your website with absolute care, security, and precision.",
  },
  {
    icon: Clock,
    title: "Quick to launch",
    description: "Your preview is built before you pay anything, refined together in the first week, and live on your domain within days of subscribing.",
  },
]

const projectTypes = [
  {
    icon: Globe,
    title: "Your website",
    description: "A fast, modern website shaped around your business — designed, built, hosted, and maintained for you, all included.",
  },
  {
    icon: CalendarClock,
    title: "Bookings & enquiries",
    description: "Bookings, contact forms, and a central enquiry inbox — built into your site and managed from the same admin area.",
  },
  {
    icon: LayoutDashboard,
    title: "Sauro CMS",
    description: "Your own private admin area — update pages, prices, opening hours, news, and media yourself in minutes, no developer required.",
  },
]

export function ServicesSection() {
  return (
    <section
      id="services"
      className="border-t border-[color-mix(in_oklch,var(--vd-fg)_5%,transparent)] pt-14 pb-12"
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="vd-as-title mb-4">Everything your business website needs, for £99 a month.</h2>

        <div className="mb-10 grid gap-10 lg:grid-cols-[1fr_280px] lg:items-start">
          <div className="max-w-[42rem]">
            <p className="text-[0.9375rem] leading-[1.8] text-[var(--vd-copy)]">
              Your new website is designed and built before you pay a penny — you try it free for 14 days, then
              decide. Once you subscribe, hosting, security, updates, bookings, enquiry tools, and small content
              changes are all included in one flat monthly price, with your content and domain always yours.
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

          {/* Column 2: What's included */}
          <div>
            <h3 className="mb-6 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-foreground/70">
              What&apos;s included
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
