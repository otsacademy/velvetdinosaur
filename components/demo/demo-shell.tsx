import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, FlaskConical } from "lucide-react"
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
  title?: string
  description?: string
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
  const isLanding = mode === "landing"

  return (
    <div className="vd-demo-shell min-h-screen text-[var(--vd-fg)]">
      <header className="vd-demo-banner sticky top-0 z-40 border-b">
        <div className={cn("mx-auto max-w-6xl px-4 sm:px-6", isLanding ? "py-3" : "py-4")}>
          <div
            className={cn(
              "gap-4",
              isLanding
                ? "grid items-center lg:grid-cols-[auto_minmax(0,1fr)_auto]"
                : "flex flex-col lg:flex-row lg:items-center lg:justify-between"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-[color-mix(in_oklch,var(--vd-primary)_10%,var(--vd-bg))] text-[var(--vd-primary)] shadow-[0_12px_24px_-22px_color-mix(in_oklch,var(--vd-primary)_40%,transparent)] sm:h-9 sm:w-9">
                {isLanding ? (
                  <Image
                    src="/logo.webp"
                    alt="Velvet Dinosaur"
                    width={36}
                    height={36}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <FlaskConical className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold tracking-tight">Sauro CMS Demo</p>
                  <Badge className="vd-demo-shell-badge" data-tone={isWorkspace ? "workspace" : "public"}>
                    {isWorkspace ? "Disposable demo" : "Public sandbox"}
                  </Badge>
                </div>
                {!isLanding ? (
                  <p className="text-sm text-[var(--vd-muted-fg)]">
                    Dummy content only. Nothing here is saved or sent anywhere.
                  </p>
                ) : null}
              </div>
            </div>

            {isLanding ? (
              <p className="text-center text-xs leading-5 text-[var(--vd-muted-fg)] lg:px-6">
                Dummy content only. Nothing here is saved or sent anywhere.
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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

          <div className={cn(isLanding ? "mt-2" : "mt-4")}>
            <nav className="-mx-1 overflow-x-auto pb-1 [scrollbar-color:color-mix(in_oklch,var(--vd-border)_84%,transparent)_transparent] [scrollbar-width:thin]">
              <div className="flex min-w-max items-center gap-2 px-1">
                <Link
                  href={landingHref}
                  data-state={currentPath === "/" ? "active" : "inactive"}
                  aria-current={currentPath === "/" ? "page" : undefined}
                  className={cn(
                    "vd-demo-nav-link inline-flex min-h-9 shrink-0 items-center border px-4 text-xs font-medium transition-colors sm:text-sm",
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
                        "vd-demo-nav-link inline-flex min-h-9 shrink-0 items-center border px-4 text-xs font-medium transition-colors sm:text-sm",
                        isActive
                          ? "border-[color-mix(in_oklch,var(--vd-primary)_22%,var(--vd-border))] bg-[color-mix(in_oklch,var(--vd-primary)_7%,var(--vd-bg))] text-[var(--vd-fg)]"
                          : "border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] text-[var(--vd-muted-fg)] hover:text-[var(--vd-fg)]"
                      )}
                    >
                      {feature.title}
                    </Link>
                  )
                })}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {isAppPresentation ? (
        <main className="py-6 md:py-8">{children}</main>
      ) : (
        <main className={cn("mx-auto flex flex-col gap-8 px-4 sm:px-6", isLanding ? "max-w-6xl py-6 md:py-8" : "max-w-6xl py-8 md:py-10")}>
          {title ? (
            <section className="max-w-3xl space-y-3">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--vd-fg)] md:text-3xl">
                {title}
              </h1>
              {description ? (
                <p className="text-base leading-7 text-[var(--vd-muted-fg)]">
                  {description}
                </p>
              ) : null}
            </section>
          ) : null}

          {children}
        </main>
      )}
    </div>
  )
}
