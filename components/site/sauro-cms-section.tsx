import { ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export function SauroCmsSection() {
  const demoHomeHref = "/demo/new"

  return (
    <section id="cms" className="py-9">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="vd-section-kicker">Content control</p>
          <h2 className="text-2xl font-semibold tracking-tight">Sauro CMS</h2>
          <p className="text-muted-foreground">
            To give clients flexibility after launch, I built Sauro CMS: a founder-friendly editing system designed to
            stay simple while being tailored to each project. It keeps day-to-day content updates easy without forcing
            you into a generic platform model.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-[1.25rem] border border-[color-mix(in_oklch,var(--vd-dino-blue)_16%,var(--vd-border))] bg-[color-mix(in_oklch,var(--vd-dino-blue)_3%,var(--vd-bg))] px-6 py-8 shadow-[0_18px_36px_-30px_color-mix(in_oklch,var(--vd-dino-blue)_24%,transparent)] sm:px-10 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Interactive sandbox</p>
            <h3 className="text-xl font-semibold tracking-tight text-foreground">Let prospects click around before they ever book a call.</h3>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              The demo routes use dummy content and disposable state, so visitors can explore the Page Editor, Article Editor, Contact Templates, Newsletter, Reviews, Theme Editor, Inbox, Calendar, Media Library, Support Portal, Stays, Routes, and the Booking API safely.
            </p>
          </div>
          <Button asChild className="vd-dino-cta min-h-12 rounded-full px-6 text-sm font-medium">
            <a href={demoHomeHref}>
              Try the editor
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
