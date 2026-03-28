import Link from "next/link"
import { ArrowRight, ArrowUpRight, FlaskConical, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DemoResetButton } from "@/components/demo/demo-reset-button.client"
import { cn } from "@/lib/utils"
import {
  demoFeatures,
  getDemoRoutePath,
  resolvePrimarySiteUrl,
  type DemoRouteVariant
} from "@/lib/demo-site"

type DemoShellProps = {
  currentPath: "/" | "/new" | "/theme-editor" | "/inbox" | "/calendar"
  variant: DemoRouteVariant
  mode?: "landing" | "workspace"
  presentation?: "marketing" | "app"
  title: string
  description: string
  headerAccessory?: React.ReactNode
  children: React.ReactNode
}

export function DemoShell({
  currentPath,
  variant,
  mode = "workspace",
  presentation = "marketing",
  title,
  description,
  headerAccessory,
  children
}: DemoShellProps) {
  const mainSiteHref = resolvePrimarySiteUrl("/")
  const landingHref = getDemoRoutePath("/", variant)
  const isWorkspace = mode === "workspace"
  const isAppPresentation = presentation === "app"

  return (
    <div className="vd-demo-shell min-h-screen text-[var(--vd-fg)]">
      <header className="vd-demo-banner sticky top-0 z-40 border-b">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-[color-mix(in_oklch,var(--vd-primary)_10%,var(--vd-bg))] text-[var(--vd-primary)] shadow-[0_16px_34px_-28px_color-mix(in_oklch,var(--vd-primary)_40%,transparent)]">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold tracking-tight">Sauro CMS Demo</p>
                  <Badge className="vd-demo-shell-badge" data-tone={isWorkspace ? "workspace" : "public"}>
                    {isWorkspace ? "Disposable demo" : "Public sandbox"}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--vd-muted-fg)]">
                  Dummy content only. Nothing here is saved or sent anywhere.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {headerAccessory}
              {isWorkspace ? <DemoResetButton /> : null}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="vd-demo-toolbar-button vd-demo-toolbar-button-subtle"
              >
                <a href={mainSiteHref}>
                  Back to main site
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
              <a
                href={`${mainSiteHref}#contact`}
                className="vd-demo-cta inline-flex min-h-9 items-center justify-center gap-2 bg-[var(--vd-primary)] px-4 text-sm font-medium text-[var(--vd-primary-fg)]"
              >
                Start a real project
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href={landingHref}
              data-state={currentPath === "/" ? "active" : "inactive"}
              aria-current={currentPath === "/" ? "page" : undefined}
              className={cn(
                "vd-demo-nav-link inline-flex min-h-10 items-center border px-4 text-sm font-medium transition-colors",
                currentPath === "/"
                  ? "border-[color-mix(in_oklch,var(--vd-primary)_22%,var(--vd-border))] bg-[color-mix(in_oklch,var(--vd-primary)_7%,var(--vd-bg))] text-[var(--vd-fg)]"
                  : "border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] text-[var(--vd-muted-fg)] hover:text-[var(--vd-fg)]"
              )}
            >
              Overview
            </Link>
            {demoFeatures.map((feature) => {
              const isActive = currentPath === feature.path
              return (
                <Link
                  key={feature.slug}
                  href={getDemoRoutePath(feature.path, variant)}
                  data-state={isActive ? "active" : "inactive"}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "vd-demo-nav-link inline-flex min-h-10 items-center border px-4 text-sm font-medium transition-colors",
                    isActive
                      ? "border-[color-mix(in_oklch,var(--vd-primary)_22%,var(--vd-border))] bg-[color-mix(in_oklch,var(--vd-primary)_7%,var(--vd-bg))] text-[var(--vd-fg)]"
                      : "border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] text-[var(--vd-muted-fg)] hover:text-[var(--vd-fg)]"
                  )}
                >
                  {feature.title}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {isAppPresentation ? (
        <main className="py-6 md:py-8">{children}</main>
      ) : (
        <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 md:py-10">
          <section className="grid gap-6 rounded-[2rem] border border-[color-mix(in_oklch,var(--vd-border)_80%,transparent)] bg-[linear-gradient(135deg,color-mix(in_oklch,var(--vd-bg)_92%,white),color-mix(in_oklch,var(--vd-primary)_4%,var(--vd-bg)))] p-6 shadow-[0_26px_90px_-54px_color-mix(in_oklch,var(--vd-fg)_34%,transparent)] md:p-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--vd-muted-fg)]">
                <Sparkles className="h-4 w-4 text-[var(--vd-primary)]" />
                Interactive walkthrough
              </div>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-[var(--vd-fg)] md:text-5xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--vd-muted-fg)] md:text-lg">
                  {description}
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[color-mix(in_oklch,var(--vd-border)_78%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_88%,transparent)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--vd-muted-fg)]">
                Demo rules
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--vd-muted-fg)]">
                <li>Every screen is backed by dummy content.</li>
                <li>Buttons update local state only and reset on refresh.</li>
                <li>The point is to show the workflow, not expose production data.</li>
              </ul>
            </div>
          </section>

          {children}
        </main>
      )}
    </div>
  )
}
