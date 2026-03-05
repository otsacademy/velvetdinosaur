import { Accessibility, Gauge, Search, ShieldCheck } from "lucide-react"

type Metric = {
  title: string
  score: string
  note: string
  icon: React.ComponentType<{ className?: string }>
}

const metrics: Metric[] = [
  {
    title: "Performance",
    score: "100",
    note: "Fast pages keep visitors engaged and reduce drop-off.",
    icon: Gauge,
  },
  {
    title: "Accessibility",
    score: "100",
    note: "Clear structure and contrast improve usability for screen readers and all users.",
    icon: Accessibility,
  },
  {
    title: "Best Practices",
    score: "100",
    note: "Secure HTTPS and modern browser-safe standards reduce risk for your business.",
    icon: ShieldCheck,
  },
  {
    title: "SEO",
    score: "100",
    note: "Clean crawl signals and metadata help search engines understand your pages.",
    icon: Search,
  },
]

export function PageSpeedGuaranteeSection() {
  return (
    <section id="pagespeed" className="py-8 md:py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-6 space-y-2">
          <h2 className="vd-section-heading text-2xl font-semibold">Built for a perfect score</h2>
          <p className="max-w-3xl text-muted-foreground">
            Every build targets 100/100 across all Google PageSpeed Insights
            categories on both desktop and mobile.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon

            return (
              <article
                key={metric.title}
                className="vd-pagespeed-card vd-hover-lift-sm rounded-2xl border border-border bg-card p-6"
              >
                <div className="mb-6 flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <Icon className="h-4 w-4 text-foreground" />
                </div>

                <p className="vd-pagespeed-score mb-2 text-5xl font-bold leading-none text-foreground">
                  {metric.score}
                </p>
                <p className="text-sm text-muted-foreground">{metric.note}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
