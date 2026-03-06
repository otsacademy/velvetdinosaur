import { Accessibility, Gauge, Search, ShieldCheck } from "lucide-react"

type Metric = {
  title: string
  score: number
  note: string
  icon: React.ComponentType<{ className?: string }>
}

const metrics: Metric[] = [
  {
    title: "Performance",
    score: 100,
    note: "Fast pages keep visitors engaged and reduce drop-off.",
    icon: Gauge,
  },
  {
    title: "Accessibility",
    score: 100,
    note: "Readable contrast, semantic structure, and keyboard support by default.",
    icon: Accessibility,
  },
  {
    title: "Best Practices",
    score: 100,
    note: "Secure and modern implementation standards across browsers.",
    icon: ShieldCheck,
  },
  {
    title: "SEO",
    score: 100,
    note: "Crawlable markup and metadata so search engines understand your pages.",
    icon: Search,
  },
]

function ScoreRing({ value }: { value: number }) {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(100, Math.max(0, value))
  const dashOffset = circumference * (1 - clamped / 100)

  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
        <circle
          cx="36"
          cy="36"
          r={radius}
          className="stroke-border"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          className="stroke-[var(--vd-interaction-blue)]"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: dashOffset,
          }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-lg font-semibold text-foreground">{value}</span>
    </div>
  )
}

export function PageSpeedGuaranteeSection() {
  return (
    <section id="pagespeed" className="py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-6 space-y-2">
          <h2 className="vd-section-heading text-2xl font-semibold">Built for a perfect score</h2>
          <p className="max-w-3xl text-foreground/80">
            Every build targets 100/100 across all Google PageSpeed Insights categories on desktop and mobile.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon

            return (
              <article
                key={metric.title}
                className="vd-pagespeed-card vd-hover-lift-sm rounded-2xl border border-border bg-card/95 p-5"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{metric.title}</p>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="mb-4 flex items-center justify-center">
                  <ScoreRing value={metric.score} />
                </div>
                <p className="text-sm text-muted-foreground">{metric.note}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
