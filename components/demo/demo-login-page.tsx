import Link from "next/link"
import { ArrowUpRight, BedDouble, CalendarDays, Database, FilePenLine, FolderKanban, Images, Inbox, LifeBuoy, Mail, MessageSquare, Palette, Route as RouteIcon, Send, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DemoLoginForm } from "@/components/demo/demo-login-form.client"
import { demoFeatures, type DemoRouteVariant } from "@/lib/demo-site"

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

type DemoLoginPageProps = {
  nextPath: string
  landingHref: string
  variant: DemoRouteVariant
}

export function DemoLoginPage({ nextPath, landingHref, variant }: DemoLoginPageProps) {
  const accessLabel = variant === "host" ? "Demo access" : "Preview access"
  const accessContext = variant === "host" ? "Founder-friendly sandbox" : "Local fallback"

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,color-mix(in_oklch,var(--vd-primary)_10%,transparent),transparent_42%),linear-gradient(180deg,color-mix(in_oklch,var(--vd-bg)_94%,white),var(--vd-bg))] text-[var(--vd-fg)]">
      <main className="mx-auto grid min-h-screen max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Badge className="border-transparent bg-[color-mix(in_oklch,var(--vd-primary)_14%,var(--vd-bg))] text-[var(--vd-primary)]">
              {accessLabel}
            </Badge>
            <p className="text-sm text-[var(--vd-muted-fg)]">{accessContext}</p>
          </div>

          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-[var(--vd-fg)] md:text-5xl">
              Step into a disposable workspace that starts on the live page editor.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--vd-muted-fg)] md:text-lg">
              This fake sign-in makes the demo feel like a real product without exposing any live customer data, real
              permissions, or permanent writes.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {demoFeatures.map((feature) => {
              const Icon = featureIcons[feature.slug]
              return (
                <div
                  key={feature.slug}
                  className="rounded-[1.5rem] border border-[color-mix(in_oklch,var(--vd-border)_78%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_90%,transparent)] p-4"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color-mix(in_oklch,var(--vd-primary)_10%,var(--vd-bg))] text-[var(--vd-primary)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 font-semibold text-[var(--vd-fg)]">{feature.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--vd-muted-fg)]">{feature.description}</p>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--vd-muted-fg)]">
            <Link href={landingHref} className="inline-flex items-center gap-2 hover:text-[var(--vd-fg)]">
              Back to demo overview
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--vd-primary)]" />
              Nothing in this workspace is permanent.
            </span>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[color-mix(in_oklch,var(--vd-border)_80%,transparent)] bg-[linear-gradient(155deg,color-mix(in_oklch,var(--vd-card)_92%,white),color-mix(in_oklch,var(--vd-primary)_5%,var(--vd-bg)))] p-6 shadow-[0_26px_90px_-54px_color-mix(in_oklch,var(--vd-fg)_34%,transparent)] md:p-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--vd-muted-fg)]">Demo login</p>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--vd-fg)]">Unlock the workspace</h2>
            <p className="text-sm leading-6 text-[var(--vd-muted-fg)]">
              You are about to enter <span className="font-medium text-[var(--vd-fg)]">{nextPath}</span>.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <DemoLoginForm nextPath={nextPath} />
          </div>
        </section>
      </main>
    </div>
  )
}
