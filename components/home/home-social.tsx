import Image from "next/image"
import Link from "next/link"

import {
  HOME_BTN_PRIMARY,
  HOME_CARD,
  HOME_CONTAINER,
  HOME_MONO,
  SectionHeading,
} from "./home-shared"

export function Testimonial() {
  return (
    <section className={`${HOME_CONTAINER} pt-16 md:pt-[72px]`}>
      <SectionHeading
        index="04"
        title="Kind words from clients"
        aside={
          <Link
            href="/reviews"
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
        <div className={`${HOME_MONO} mb-[18px] text-[10px] text-muted-foreground`}>
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
    <section id="about" className={`${HOME_CONTAINER} scroll-mt-24 mt-12 pb-16 md:pb-[72px]`}>
      <div className="flex flex-wrap items-center justify-between gap-8 rounded-[10px] bg-[linear-gradient(135deg,var(--vd-surface-strong),color-mix(in_oklch,var(--vd-primary)_28%,var(--vd-surface-strong)))] p-8 text-[var(--vd-surface-strong-fg)] md:px-14 md:py-12">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex h-[60px] w-[60px] flex-none items-center justify-center overflow-hidden rounded-full border-2 border-white/25 bg-white/10">
            <Image
              src="/dinosaur-512.webp"
              alt="The Velvet Dinosaur mascot"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
          </div>
          <div>
            <div className="text-xl font-bold tracking-[-0.01em]">
              Hi, I&apos;m Ian — you&apos;ll work directly with me.
            </div>
            <div className="mt-1.5 text-[13.5px] text-white/70">
              First conversation to launch. You&apos;ll hear back within one business day.
            </div>
          </div>
        </div>
        <Link
          href="/#contact"
          className={`${HOME_BTN_PRIMARY} whitespace-nowrap px-7 py-3.5 text-sm`}
        >
          Tell me about your project
        </Link>
      </div>
    </section>
  )
}
