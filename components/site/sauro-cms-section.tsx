import { ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export function SauroCmsSection() {
  const demoHomeHref = "/demo"

  return (
    <section id="cms" className="py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          {/* Left column: all text */}
          <div className="flex flex-col gap-5">
            <div className="space-y-4">
              <p className="vd-section-kicker">Content control</p>
              <h2 className="vd-as-title">Manage your own content with Sauro CMS</h2>
              <p className="text-[0.9375rem] leading-7 text-[var(--vd-copy)]">
                Its important to me that I leave you with a product that can grow with your needs. I built Sauro CMS
                to be an easy and simple content management system (CMS) so that you can update content without forcing
                you to learn how to code. Each instance of the CMS is tailor made to your needs and to your requirements.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Explore the editor before you even book a call.
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                The interactive sandbox uses dummy content and disposable state, so you can safely test drive
                the Page Editor, Article Editor, and other tools.
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                This sandbox is purely illustrative. Your final interface will be custom-engineered entirely
                around your specific workflows and content.
              </p>
            </div>

            <div>
              <Button asChild className="vd-dino-cta min-h-12 rounded-full px-6 text-sm font-medium">
                <a href={demoHomeHref}>
                  Try the editor
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Right column: demo preview (unchanged) */}
          <div className="overflow-hidden rounded-[1.5rem] border border-[color-mix(in_oklch,var(--vd-border)_78%,transparent)] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--vd-card)_92%,white),color-mix(in_oklch,var(--vd-bg)_96%,white))] shadow-[0_28px_80px_-56px_color-mix(in_oklch,var(--vd-fg)_32%,transparent)]">
            <div className="flex items-center justify-between gap-4 border-b border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklch,var(--destructive)_72%,white)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklch,var(--vd-accent)_72%,white)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklch,var(--vd-score-perfect)_72%,white)]" />
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Public sandbox preview at 50%
              </p>
            </div>

            <div className="relative aspect-[16/10] overflow-hidden bg-white">
              <div className="absolute inset-0 h-[200%] w-[200%] origin-top-left scale-[0.5] transform">
                <iframe
                  title="Sauro CMS demo preview"
                  src={demoHomeHref}
                  loading="lazy"
                  className="h-full w-full border-0 bg-white"
                />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/78 to-transparent" />
            </div>

            <div className="flex flex-col gap-3 border-t border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Live route, dummy content, and disposable state. Open the full-size version when you want to interact.
              </p>
              <Button asChild variant="outline" className="rounded-full px-5 text-sm">
                <a href={demoHomeHref}>
                  Open full demo
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
