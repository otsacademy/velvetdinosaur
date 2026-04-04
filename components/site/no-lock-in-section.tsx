import { PoundSterling, ShieldCheck, Waypoints } from "lucide-react"

import { Button } from "@/components/ui/button"

type TrustStat = {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}

const trustStats: TrustStat[] = [
  {
    label: "Ongoing care",
    value: "Performance & security plan",
    icon: PoundSterling,
  },
  {
    label: "Ownership",
    value: "100% yours",
    icon: ShieldCheck,
  },
  {
    label: "Migration path",
    value: "Supported and smooth",
    icon: Waypoints,
  },
]

export function NoLockInSection() {
  return (
    <section id="ownership" className="py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="vd-surface-panel vd-soft-panel grid gap-6 p-6 md:p-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <p className="vd-section-kicker">Ownership model</p>
            <h2 className="text-2xl font-semibold tracking-tight">Your website. Your way.</h2>
            <p className="max-w-2xl text-[var(--vd-copy)]">
              No lock-in contracts and no platform traps. You own your domain,
              content, and website code from day one, with access set up in your
              name so you stay in control.
            </p>
            <p className="max-w-2xl text-[var(--vd-copy)]">
              If you ever decide to move providers, we support the migration with
              handover notes and practical help so your website and email continue
              running smoothly.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="vd-dino-cta rounded-full px-6 text-[0.9375rem] font-medium">
                <a href="#contact">Talk through your project</a>
              </Button>
              <Button asChild variant="outline" className="vd-pill-outline rounded-full px-6 text-[0.9375rem] font-medium">
                <a href="#pricing">See pricing</a>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {trustStats.map((stat) => {
              const Icon = stat.icon

              return (
                <article
                  key={stat.label}
                  className="rounded-xl border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-background p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-wide text-[var(--vd-muted-fg)]">
                      {stat.label}
                    </p>
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{stat.value}</p>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
