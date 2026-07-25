import type { Metadata } from "next"

import { DesignShell } from "@/components/home/design-shell"
import { HOME_CONTAINER, HOME_MONO } from "@/components/home/home-shared"
import { CtaStrip } from "@/components/home/home-social"
import { WorkGrid } from "@/components/home/work-grid.client"
import { siteName } from "@/lib/site-metadata"

const workDescription =
  "Real projects, real outcomes — charities, professional services, travel, and product platforms built by Velvet Dinosaur for speed, clarity, and content the client controls."

export const metadata: Metadata = {
  title: "Work",
  description: workDescription,
  alternates: { canonical: "/work" },
  openGraph: {
    type: "website",
    url: "/work",
    siteName,
    title: `Work | ${siteName}`,
    description: workDescription,
  },
}

export default function WorkIndexPage() {
  return (
    <DesignShell active="work">
      <section className="border-b border-border bg-background">
        <div className={`${HOME_CONTAINER} py-12 md:pb-12 md:pt-16`}>
          <div className={`${HOME_MONO} mb-4 text-[11px] text-primary`}>The work</div>
          <h1 className="m-0 mb-3.5 text-balance text-4xl font-extrabold tracking-[-0.033em] md:text-[42px]">
            Real projects, real outcomes.
          </h1>
          <p className="m-0 max-w-[560px] text-pretty text-base leading-relaxed text-muted-foreground">
            Charities, professional services, travel, and product platforms — each built for
            speed, clarity, and content the client controls.
          </p>
        </div>
      </section>

      <div className={`${HOME_CONTAINER} pb-6 pt-10`}>
        <WorkGrid />
      </div>

      <div className="pt-6">
        <CtaStrip kicker="Your project could be next" title="Have something similar in mind?" />
      </div>
    </DesignShell>
  )
}
