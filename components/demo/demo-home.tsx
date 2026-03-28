import Link from "next/link"
import { BedDouble, CalendarDays, Database, FilePenLine, FolderKanban, Images, Inbox, LifeBuoy, Mail, MessageSquare, Palette, Play, Route as RouteIcon, Send, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { demoFeatures, getDemoRoutePath, type DemoRouteVariant } from "@/lib/demo-site"

const featureIcons = {
  new: FolderKanban,
  news: FilePenLine,
  "contact-templates": Mail,
  newsletter: Send,
  reviews: MessageSquare,
  stays: BedDouble,
  routes: RouteIcon,
  bookings: Database,
  "theme-editor": Palette,
  inbox: Inbox,
  calendar: CalendarDays,
  media: Images,
  support: LifeBuoy
} as const

type DemoHomeProps = {
  variant: DemoRouteVariant
}

export function DemoHome({ variant }: DemoHomeProps) {
  const primaryHref = getDemoRoutePath("/new", variant)

  return (
    <div className="grid gap-8">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <div className="space-y-6">
          <div className="max-w-2xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--vd-muted-fg)]">
              Explore the client-side experience
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--vd-fg)] md:text-4xl">
              Open the live page editor first, then branch into templates, newsletter, reviews, travel tools, and the rest of the client workspace.
            </h2>
            <p className="text-base leading-7 text-[var(--vd-muted-fg)]">
              This sandbox is designed for sales calls and self-serve exploration. Visitors can drop straight into the
              editor surface, test the component library, upload assets, and move through the surrounding messaging,
              publishing, review, travel, and support workflows without risking real content.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-[var(--vd-primary)] px-6 text-[var(--vd-primary-fg)] shadow-[0_24px_50px_-28px_color-mix(in_oklch,var(--vd-primary)_60%,transparent)]"
            >
              <Link href={primaryHref}>Try the editor</Link>
            </Button>
            <p className="text-sm leading-6 text-[var(--vd-muted-fg)]">
              No real auth, no persistent data, and no production risk.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {demoFeatures.map((feature) => (
              <Link
                key={feature.slug}
                href={getDemoRoutePath(feature.path, variant)}
                className="inline-flex min-h-11 items-center rounded-full border border-[color-mix(in_oklch,var(--vd-border)_75%,transparent)] px-4 text-sm font-medium text-[var(--vd-fg)] transition-colors hover:border-[color-mix(in_oklch,var(--vd-primary)_24%,var(--vd-border))] hover:bg-[color-mix(in_oklch,var(--vd-primary)_6%,var(--vd-bg))]"
              >
                {feature.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-[color-mix(in_oklch,var(--vd-border)_80%,transparent)] bg-[linear-gradient(155deg,color-mix(in_oklch,var(--vd-primary)_6%,var(--vd-bg)),color-mix(in_oklch,var(--vd-card)_92%,white))] p-6 shadow-[0_26px_90px_-60px_color-mix(in_oklch,var(--vd-primary)_28%,transparent)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--vd-muted-fg)]">
                Guided walkthrough
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--vd-fg)]">Recommended route</p>
            </div>
            <Badge className="border-transparent bg-[color-mix(in_oklch,var(--vd-primary)_12%,var(--vd-bg))] text-[var(--vd-primary)]">
              {demoFeatures.length} steps
            </Badge>
          </div>

          <div className="mt-6 space-y-4">
            {demoFeatures.map((feature, index) => {
              const Icon = featureIcons[feature.slug]
              return (
                <div
                  key={feature.slug}
                  className="rounded-[1.5rem] border border-[color-mix(in_oklch,var(--vd-border)_78%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_86%,transparent)] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_oklch,var(--vd-primary)_10%,var(--vd-bg))] text-[var(--vd-primary)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--vd-muted-fg)]">
                        Step {index + 1}
                      </p>
                      <p className="font-semibold text-[var(--vd-fg)]">{feature.title}</p>
                      <p className="text-sm leading-6 text-[var(--vd-muted-fg)]">{feature.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {demoFeatures.map((feature) => {
          const Icon = featureIcons[feature.slug]
          return (
            <Link
              key={feature.slug}
              href={getDemoRoutePath(feature.path, variant)}
              className="group overflow-hidden rounded-[2rem] border border-[color-mix(in_oklch,var(--vd-border)_80%,transparent)] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--vd-card)_92%,white),color-mix(in_oklch,var(--vd-bg)_96%,white))] p-6 shadow-[0_22px_70px_-56px_color-mix(in_oklch,var(--vd-fg)_34%,transparent)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color-mix(in_oklch,var(--vd-primary)_10%,var(--vd-bg))] text-[var(--vd-primary)]">
                  <Icon className="h-5 w-5" />
                </div>
                <Play className="h-4 w-4 text-[var(--vd-muted-fg)] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[var(--vd-fg)]" />
              </div>
              <div className="mt-6 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--vd-muted-fg)]">
                  {feature.eyebrow}
                </p>
                <h3 className="text-xl font-semibold text-[var(--vd-fg)]">{feature.title}</h3>
                <p className="text-sm leading-6 text-[var(--vd-muted-fg)]">{feature.description}</p>
              </div>
              <div className="mt-6 space-y-2 text-sm text-[var(--vd-muted-fg)]">
                {feature.bullets.map((bullet) => (
                  <div key={bullet} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--vd-primary)]" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </Link>
          )
        })}
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-[color-mix(in_oklch,var(--vd-border)_78%,transparent)] bg-[color-mix(in_oklch,var(--vd-primary)_4%,var(--vd-bg))] p-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-center">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--vd-muted-fg)]">
            Why this works in sales
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-[var(--vd-fg)]">
            Prospects can explore the software directly without touching a live database or a real customer account.
          </h3>
          <p className="text-sm leading-6 text-[var(--vd-muted-fg)]">
            Every message, page section, upload, and theme change is disposable, so the demos stay convincing without
            creating operational risk.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[color-mix(in_oklch,var(--vd-border)_75%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_88%,transparent)] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color-mix(in_oklch,var(--vd-primary)_10%,var(--vd-bg))] text-[var(--vd-primary)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-[var(--vd-fg)]">Safe by default</p>
              <p className="text-sm leading-6 text-[var(--vd-muted-fg)]">
                No customer data, no persistent writes, no real permissions, and no accidental edits to the production
                site.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
