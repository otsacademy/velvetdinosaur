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
    <section id="pagespeed" className="py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="vd-surface-panel relative overflow-hidden border border-white/8 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--vd-primary)_24%,transparent),transparent_38%),linear-gradient(155deg,var(--vd-surface-strong),color-mix(in_oklch,var(--vd-surface-strong)_84%,black))] px-6 py-8 text-[var(--vd-surface-strong-fg)] md:px-8 md:py-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_oklch,white_16%,transparent)_1px,transparent_0)] [background-size:20px_20px]"
            aria-hidden="true"
          />
          <div className="relative mx-auto mb-10 max-w-3xl space-y-4 text-center">
            <p className="inline-flex w-fit items-center rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/78">
              Verification layer
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Built for a perfect score</h2>
            <p className="text-white/72">
              Every build targets 100/100 across all Google PageSpeed Insights categories on desktop and mobile.
            </p>
          </div>

          <div className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon

              return (
                <article
                  key={metric.title}
                  className="vd-surface-card border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white/82">{metric.title}</p>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--vd-score-perfect)_18%,transparent)] text-[color:var(--vd-score-perfect)]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-[6px] border-[color:var(--vd-score-perfect)] bg-[color-mix(in_oklch,var(--vd-score-perfect)_10%,transparent)]">
                    <span className="text-2xl font-bold leading-none text-[color:var(--vd-score-perfect)]">{metric.score}</span>
                  </div>
                  <p className="text-sm text-white/62">Google Lighthouse benchmark</p>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
