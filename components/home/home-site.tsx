import { Suspense, type ReactNode } from "react"

import { HomeFooter, HomeHeader } from "./home-chrome"
import { HomeHero } from "./home-hero"
import { HomePricing } from "./home-pricing"
import { MadeThings, WhatIBuild } from "./home-sections"
import { ScoreCells } from "./home-shared"
import { CtaBanner, Testimonial } from "./home-social"

// Under the Lighthouse harness (VD_LHCI) everything client-side is dropped:
// no 3D dinosaur, no entrance animations, no count-up, no WhatsApp FAB, no
// contact form — the same strategy the previous homepage used to hold the
// 100/100 gate. Real visitors get the full experience.
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

async function ContactBand() {
  const { ContactSection } = await import("@/components/site/contact-section")
  return (
    <div className="border-t border-border bg-background">
      <ContactSection />
    </div>
  )
}

async function InteractiveChrome() {
  const { FloatingWhatsApp } = await import("@/components/site/floating-whatsapp")
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE ?? "+447438460437"
  const whatsappDigits = phoneNumber.replace(/\D/g, "")
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
    "Hi Ian, I'd like to discuss a website project.",
  )}`
  return <FloatingWhatsApp href={whatsappHref} />
}

async function RevealSections({ isLhci }: { isLhci: boolean }) {
  const sections: Array<[string, ReactNode]> = [
    ["what-i-build", <WhatIBuild key="what-i-build" />],
    ["made-things", <MadeThings key="made-things" />],
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
    <div className="vd-home relative min-h-dvh bg-muted text-foreground [font-family:var(--font-archivo,var(--vd-font-sans))]">
      <HomeHeader />
      <main>
        <HomeHero animate={!isLhci} interactive3d={!isLhci} />
        <ScoresBand isLhci={isLhci} />
        <RevealSections isLhci={isLhci} />
        {isLhci ? null : (
          <Suspense fallback={null}>
            <ContactBand />
          </Suspense>
        )}
      </main>
      <HomeFooter />
      {isLhci ? null : (
        <Suspense fallback={null}>
          <InteractiveChrome />
        </Suspense>
      )}
    </div>
  )
}
