import { Accessibility, Gauge, Search, ShieldCheck } from "lucide-react"

type Metric = {
  title: string
  score: number
  icon: React.ComponentType<{ className?: string }>
}

const metrics: Metric[] = [
  { title: "Performance", score: 100, icon: Gauge },
  { title: "Accessibility", score: 100, icon: Accessibility },
  { title: "Best Practices", score: 100, icon: ShieldCheck },
  { title: "SEO", score: 100, icon: Search },
]

export function PageSpeedGuaranteeSection() {
  return (
    <section id="pagespeed" className="py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">Verification layer</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Built for a perfect score</h2>
          <p className="max-w-3xl text-foreground/80">
            Every build targets 100/100 across all Google PageSpeed Insights categories on desktop and mobile.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-[linear-gradient(120deg,color-mix(in_srgb,var(--vd-primary)_18%,transparent),color-mix(in_srgb,var(--vd-accent)_72%,var(--vd-bg)),color-mix(in_srgb,var(--vd-primary)_10%,transparent))] p-5 md:p-7">
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_srgb,var(--vd-primary)_38%,transparent)_1px,transparent_0)] [background-size:20px_20px]" aria-hidden="true" />
          <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {metrics.map((metric) => {
              const Icon = metric.icon

              return (
                <article
                  key={metric.title}
                  className="rounded-xl bg-background/72 px-4 py-4 backdrop-blur-sm lg:rounded-none lg:bg-transparent lg:px-5 lg:py-3 lg:border-l lg:border-primary/20 first:lg:border-l-0"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground/90">{metric.title}</p>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-5xl font-bold leading-none text-foreground">{metric.score}</p>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
