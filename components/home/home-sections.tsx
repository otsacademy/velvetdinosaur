import Link from "next/link"

import {
  HOME_CARD,
  HOME_CARD_HOVER,
  HOME_CONTAINER,
  HOME_KICKER,
  SectionHeading,
} from "./home-shared"

const BUILD_CARDS = [
  {
    kicker: "Designed, built & managed",
    title: "Your website",
    body: "A fast, modern website shaped around your business — designed, built, hosted, and maintained for you, all included in one monthly price.",
  },
  {
    kicker: "Included with every site",
    title: "Bookings & enquiries",
    body: "Bookings, contact forms, and a central enquiry inbox — built into your site and managed from the same admin area, at no extra cost.",
  },
  {
    kicker: "Included with every site",
    title: "Sauro CMS",
    body: "Every site includes your own private CMS — update pages, news, and media yourself in minutes, no developer required.",
  },
] as const

export function WhatIBuild() {
  return (
    <section id="services" className="scroll-mt-24">
      <div className={`${HOME_CONTAINER} pt-16 md:pt-[72px]`}>
        <SectionHeading
          index="01"
          title="What you get"
          aside={
            <span className="text-[13px] text-muted-foreground">
              One monthly price — everything shaped around your business.
            </span>
          }
        />
        <div className="grid gap-4 md:grid-cols-3">
          {BUILD_CARDS.map((card) => (
            <div
              key={card.title}
              className={`${HOME_CARD} ${HOME_CARD_HOVER} flex flex-col gap-3 p-7`}
            >
              <div className={`${HOME_KICKER} text-[11px] text-muted-foreground`}>{card.kicker}</div>
              <div className="text-[17px] font-bold">{card.title}</div>
              <div className="text-[14px] leading-relaxed text-muted-foreground">{card.body}</div>
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
            href="/work/academics-stand-against-poverty"
            className={`flex min-h-[240px] flex-col justify-between gap-6 rounded-lg bg-[color-mix(in_oklch,var(--vd-primary)_38%,var(--vd-surface-strong))] p-9 text-white transition-[transform,box-shadow] duration-300 ease-[var(--vd-hover-ease)] hover:-translate-y-1 hover:text-white hover:shadow-[var(--vd-shadow-xl)]`}
          >
            <div className={`${HOME_KICKER} text-[11px] text-white/70`}>Charity · live project</div>
            <div>
              <div className="mb-2.5 text-[22px] font-bold leading-snug">
                Academics Stand Against Poverty
              </div>
              <div className="max-w-[420px] text-[14px] leading-relaxed text-white/80">
                A global academic network fighting poverty — rebuilt for clarity and speed, with
                structured content the team manages themselves.
              </div>
            </div>
          </Link>
          <Link
            href="/work"
            className={`${HOME_CARD} ${HOME_CARD_HOVER} flex min-h-[240px] flex-col justify-between gap-6 p-9 text-foreground hover:text-foreground`}
          >
            <div className={`${HOME_KICKER} text-[11px] text-muted-foreground`}>Product</div>
            <div>
              <div className="mb-2.5 text-[22px] font-bold leading-snug">Sauro CMS</div>
              <div className="text-[14px] leading-relaxed text-muted-foreground">
                The calm, private content manager included with every Velvet Dinosaur build.
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}

// Short value statement shown directly under the hero scores band.
export function PromiseStatement() {
  return (
    <section className="border-b border-border bg-background">
      <div className={`${HOME_CONTAINER} py-14 text-center md:py-16`}>
        <p className="font-display m-0 text-balance text-[26px] leading-snug md:text-[32px]">
          Designed for you. Editable by you. Managed and backed up by us.
        </p>
        <p className="mx-auto mb-0 mt-4 max-w-[640px] text-pretty text-[15px] leading-relaxed text-muted-foreground">
          Update and develop your website through Sauro CMS, undo mistakes using version history,
          and contact Ian directly whenever you need help.
        </p>
      </div>
    </section>
  )
}

// The managed-service story: the CMS is part of the value — freedom to develop
// the site yourself without being left alone with the technology.
export function ManagedValue() {
  return (
    <section id="managed" className="scroll-mt-24">
      <div className={`${HOME_CONTAINER} pt-16 md:pt-[72px]`}>
        <SectionHeading
          index="03"
          title="A beautiful website is only the beginning"
          aside={
            <span className="text-[13px] text-muted-foreground">
              What “managed” really means.
            </span>
          }
        />
        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr] lg:gap-12">
          <p className="m-0 text-pretty text-[17px] leading-relaxed text-foreground">
            AI tools and page builders can create attractive pages surprisingly quickly. But a
            dependable business website needs more than a good design.
          </p>
          <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-muted-foreground">
            <p className="m-0">
              Velvet Dinosaur takes care of everything behind your website: secure managed
              hosting, SSL, fast performance, daily backups, ongoing maintenance and continuous
              updates to Sauro CMS.
            </p>
            <p className="m-0">
              Sauro gives you the freedom to develop your website yourself. You can create and
              update pages, publish news, manage media and keep your content current without
              needing a developer. If you make a mistake, built-in version history lets you undo
              it and restore an earlier version with confidence.
            </p>
            <p className="m-0">
              Your website also keeps improving. Updates to Sauro are rolled out to our managed
              websites, with new features and refinements shaped by feedback from the people who
              use it.
            </p>
            <p className="m-0">
              And you are never left to figure things out alone. If you need assistance — or
              something important goes wrong — you can contact Ian directly: a real person, on
              hand when you need help. There is no anonymous support queue and no chatbot
              standing between you and the person responsible for your website.
            </p>
          </div>
        </div>
        <div className="mt-8 rounded-lg border border-primary/20 bg-primary/10 p-7 md:p-8">
          <div className={`${HOME_KICKER} mb-2.5 text-[11px] text-primary`}>
            That is what your monthly payment covers
          </div>
          <p className="m-0 max-w-[720px] text-[15px] font-medium leading-relaxed text-foreground">
            Not merely an attractive collection of pages, but a fast, secure and actively managed
            website that you can develop yourself — backed by a real person when you need help.
          </p>
        </div>
      </div>
    </section>
  )
}
