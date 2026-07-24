import Link from "next/link"

import {
  HOME_CARD,
  HOME_CARD_HOVER,
  HOME_CONTAINER,
  HOME_MONO,
  SectionHeading,
} from "./home-shared"

const BUILD_CARDS = [
  {
    kicker: "Marketing sites & more",
    title: "Websites",
    body: "High-performance marketing sites, portfolios, editorial platforms, and landing pages — engineered for conversion and search from day one.",
  },
  {
    kicker: "iOS & Android",
    title: "Mobile apps",
    body: "Bespoke iOS and Android apps — from customer-facing products to internal tools that streamline how your organisation runs.",
  },
  {
    kicker: "Included with every build",
    title: "Sauro CMS",
    body: "Every build includes your own private CMS — update pages, news, and media yourself in minutes, no developer required.",
  },
] as const

export function WhatIBuild() {
  return (
    <section id="services" className="scroll-mt-24">
      <div className={`${HOME_CONTAINER} pt-16 md:pt-[72px]`}>
        <SectionHeading
          index="01"
          title="What I build"
          aside={
            <span className="text-[13px] text-muted-foreground">
              No packages off a shelf — everything shaped around your goals.
            </span>
          }
        />
        <div className="grid gap-4 md:grid-cols-3">
          {BUILD_CARDS.map((card) => (
            <div
              key={card.title}
              className={`${HOME_CARD} ${HOME_CARD_HOVER} flex flex-col gap-3 p-7`}
            >
              <div className={`${HOME_MONO} text-[10px] text-muted-foreground`}>{card.kicker}</div>
              <div className="text-[17px] font-bold">{card.title}</div>
              <div className="text-[13.5px] leading-relaxed text-muted-foreground">{card.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function MadeThings() {
  return (
    <section id="portfolio" className="scroll-mt-24">
      <div className={`${HOME_CONTAINER} pt-16 md:pt-[72px]`}>
        <SectionHeading
          index="02"
          title="Some things I’ve made"
          aside={
            <Link
              href="/work"
              className="text-[13px] font-semibold text-primary transition-colors hover:text-[var(--vd-primary-hover)]"
            >
              View all →
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
          <Link
            href="/work"
            className={`flex min-h-[240px] flex-col justify-between gap-6 rounded-lg bg-[color-mix(in_oklch,var(--vd-primary)_38%,var(--vd-surface-strong))] p-9 text-white transition-[transform,box-shadow] duration-300 ease-[var(--vd-hover-ease)] hover:-translate-y-1 hover:text-white hover:shadow-[var(--vd-shadow-xl)]`}
          >
            <div className={`${HOME_MONO} text-[10px] text-white/70`}>Charity · live project</div>
            <div>
              <div className="mb-2.5 text-[22px] font-bold leading-snug">
                Academics Stand Against Poverty
              </div>
              <div className="max-w-[420px] text-[13.5px] leading-relaxed text-white/80">
                A global academic network fighting poverty — rebuilt for clarity and speed, with
                structured content the team manages themselves.
              </div>
            </div>
          </Link>
          <Link
            href="/work"
            className={`${HOME_CARD} ${HOME_CARD_HOVER} flex min-h-[240px] flex-col justify-between gap-6 p-9 text-foreground hover:text-foreground`}
          >
            <div className={`${HOME_MONO} text-[10px] text-muted-foreground`}>Product</div>
            <div>
              <div className="mb-2.5 text-[22px] font-bold leading-snug">Sauro CMS</div>
              <div className="text-[13.5px] leading-relaxed text-muted-foreground">
                The calm, private content manager included with every Velvet Dinosaur build.
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
