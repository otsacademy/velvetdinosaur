import Link from "next/link"

import { FounderAvatar } from "./founder-avatar"
import {
  HOME_BTN_PRIMARY,
  HOME_CARD,
  HOME_CONTAINER,
  HOME_KICKER,
  SectionHeading,
} from "./home-shared"

export function Testimonial() {
  return (
    <section className={`${HOME_CONTAINER} pt-16 md:pt-[72px]`}>
      <SectionHeading
        index="05"
        title="Kind words from clients"
        aside={
          <Link
            href="/about"
            className="text-[13px] font-semibold text-primary transition-colors hover:text-[var(--vd-primary-hover)]"
          >
            All reviews →
          </Link>
        }
      />
      <figure className={`${HOME_CARD} m-0 px-7 py-10 text-center md:px-14 md:py-12`}>
        <div
          aria-hidden
          className="mb-4 select-none font-serif text-7xl leading-[0.5] text-primary/20"
        >
          “
        </div>
        <div className={`${HOME_KICKER} mb-[18px] text-[11px] text-muted-foreground`}>
          ★★★★★ · a Google review
        </div>
        <blockquote className="mx-auto m-0 max-w-[760px] text-balance text-xl font-semibold leading-[1.45] tracking-[-0.015em] md:text-2xl">
          “Phenomenal service and end result from a phenomenal chap. Ian went far beyond
          expectations and built a site that is user-friendly, strategic, and genuinely tailored
          to our audience.”
        </blockquote>
        <figcaption className="mt-5 text-[13px] text-muted-foreground">
          <strong className="text-foreground">Faye Taylor</strong> · Founder, The Brave
        </figcaption>
      </figure>
    </section>
  )
}

export function CtaBanner() {
  return (
    <section className={`${HOME_CONTAINER} mt-12 pb-16 md:pb-[72px]`}>
      <div className="flex flex-wrap items-center justify-between gap-8 rounded-[10px] bg-[linear-gradient(135deg,var(--vd-surface-strong),color-mix(in_oklch,var(--vd-primary)_28%,var(--vd-surface-strong)))] p-8 text-[var(--vd-surface-strong-fg)] md:px-14 md:py-12">
        <div className="flex flex-wrap items-center gap-6">
          <FounderAvatar size={60} tone="dark" />
          <div>
            <div className="text-xl font-bold tracking-[-0.01em]">
              Hi, I&apos;m Ian — you&apos;ll work directly with me.
            </div>
            <div className="mt-1.5 text-[14px] text-white/70">
              First conversation to launch. You&apos;ll hear back within one business day.
            </div>
          </div>
        </div>
        <Link
          href="/contact"
          className={`${HOME_BTN_PRIMARY} whitespace-nowrap px-7 py-3.5 text-sm`}
        >
          Start your free preview
        </Link>
      </div>
    </section>
  )
}

// Dark gradient CTA strip used on the Work and About pages.
export function CtaStrip({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <section className={`${HOME_CONTAINER} pb-16 md:pb-[72px]`}>
      <div className="flex flex-wrap items-center justify-between gap-8 rounded-[10px] bg-[linear-gradient(135deg,var(--vd-surface-strong),color-mix(in_oklch,var(--vd-primary)_28%,var(--vd-surface-strong)))] px-8 py-9 text-[var(--vd-surface-strong-fg)] md:px-14 md:py-11">
        <div>
          {kicker ? (
            <div className={`${HOME_KICKER} mb-2.5 text-[11px] text-white/60`}>{kicker}</div>
          ) : null}
          <div className="text-[22px] font-bold tracking-[-0.02em]">{title}</div>
        </div>
        <Link
          href="/contact"
          className={`${HOME_BTN_PRIMARY} whitespace-nowrap px-7 py-3.5 text-sm`}
        >
          Start your free preview
        </Link>
      </div>
    </section>
  )
}
