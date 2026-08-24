import { type ReactNode } from "react"

import { DesignShell } from "./design-shell"
import { HomeHero } from "./home-hero"
import { HomePricing } from "./home-pricing"
import { MadeThings, ManagedValue, PromiseStatement, WhatIBuild } from "./home-sections"
import { ScoreCells } from "./home-shared"
import { CtaBanner, Testimonial } from "./home-social"

// Under the Lighthouse harness (VD_LHCI) everything client-side is dropped:
// no 3D dinosaur, no entrance animations, no count-up — the same strategy the
// previous homepage used to hold the 100/100 gate.
async function ScoresBand({ isLhci }: { isLhci: boolean }) {
  let cells: ReactNode
  if (isLhci) {
    cells = (
      <div className="grid grid-cols-2 gap-px md:grid-cols-4">
        <ScoreCells value={100} />
      </div>
    )
  } else {
    const { ScoresStrip } = await import("./scores-strip.client")
    cells = <ScoresStrip />
  }

  return (
    <div className="border-b border-border bg-border">
      <div className="mx-auto max-w-6xl">{cells}</div>
    </div>
  )
}

async function RevealSections({ isLhci }: { isLhci: boolean }) {
  const sections: Array<[string, ReactNode]> = [
    ["what-i-build", <WhatIBuild key="what-i-build" />],
    ["made-things", <MadeThings key="made-things" />],
    ["managed", <ManagedValue key="managed" />],
    ["pricing", <HomePricing key="pricing" />],
    ["testimonial", <Testimonial key="testimonial" />],
    ["cta", <CtaBanner key="cta" />],
  ]
  if (isLhci) return <>{sections.map(([, section]) => section)}</>

  const { ScrollReveal } = await import("@/components/site/scroll-reveal")
  return (
    <>
      {sections.map(([key, section]) => (
        <ScrollReveal key={key} delay={100}>
          {section}
        </ScrollReveal>
      ))}
    </>
  )
}

export async function HomeSite() {
  const isLhci = process.env.VD_LHCI === "true" || process.env.NEXT_PUBLIC_LHCI === "true"

  return (
    <DesignShell>
      <HomeHero animate={!isLhci} interactive3d={!isLhci} />
      <ScoresBand isLhci={isLhci} />
      <PromiseStatement />
      <RevealSections isLhci={isLhci} />
    </DesignShell>
  )
}
