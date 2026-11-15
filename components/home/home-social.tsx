import type { ReactNode } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { FounderAvatar } from "./founder-avatar"
import {
  BTN_LG,
  HOME_BTN_LIGHT,
  HOME_CARD,
  HOME_CONTAINER,
  HOME_KICKER,
  LETTER_LINK,
  Stars,
} from "./home-shared"
import { FEATURED_REVIEW, SUPPORTING_REVIEWS, type GoogleReview } from "./site-data"

/** One Google review as a card, with a link back to the original. */
export function ReviewCard({ review, className }: { review: GoogleReview; className?: string }) {
  return (
    <figure data-reveal className={cn(HOME_CARD, "m-0 flex flex-col p-[30px]", className)}>
      <Stars />
      <blockquote className="m-0 mt-4 flex-1 text-lg leading-[1.55] text-foreground">
        “{review.quote}”
      </blockquote>
      <figcaption className="mt-5 text-base text-muted-foreground">
        <strong className="block font-semibold text-foreground">{review.name}</strong>
        {review.role ? `${review.role} · ` : null}
        <a
          href={review.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${review.name}’s review on Google Maps`}
          className={LETTER_LINK}
        >
          Google Maps
        </a>
      </figcaption>
    </figure>
  )
}

export function HomeReviews() {
  return (
    <section
      id="reviews"
      className="mt-20 scroll-mt-20 border-y border-border bg-muted sm:mt-28"
    >
      <div className={`${HOME_CONTAINER} pb-20 pt-[72px] sm:pb-[100px] sm:pt-24`}>
        <figure data-reveal className="m-0 mx-auto max-w-[940px] text-center">
          <h2 className={`${HOME_KICKER} m-0 mb-5 text-accent`}>
            Part four · Kind words from clients
          </h2>
          <Stars size={24} className="justify-center" />
          <blockquote className="m-0 mt-[22px] text-balance font-serif text-[clamp(1.6875rem,3.1vw,2.625rem)] italic leading-[1.22] tracking-[-0.012em]">
            “{FEATURED_REVIEW.quote}”
          </blockquote>
          <figcaption className="mt-6 text-lg text-muted-foreground">
            <strong className="font-semibold text-foreground">{FEATURED_REVIEW.name}</strong>,{" "}
            {FEATURED_REVIEW.role} ·{" "}
            <a
              href={FEATURED_REVIEW.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={LETTER_LINK}
            >
              View on Google Maps
            </a>
          </figcaption>
        </figure>
        <div className="mt-12 grid gap-[22px] sm:mt-16 lg:grid-cols-3">
          {SUPPORTING_REVIEWS.map((review) => (
            <ReviewCard key={review.name} review={review} />
          ))}
        </div>
      </div>
    </section>
  )
}

// The navy call-to-action panel that closes the inner pages.
export function CtaPanel({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className={`${HOME_CONTAINER} pb-20 pt-[72px] sm:pb-[104px]`}>
      <div
        data-reveal
        className="flex flex-wrap items-center justify-between gap-7 rounded-lg bg-primary px-7 py-9 text-primary-foreground sm:px-[46px] sm:py-11"
      >
        <div className="flex flex-[1_1_420px] flex-wrap items-center gap-[22px]">
          <FounderAvatar size={84} />
          <div className="flex-[1_1_280px]">
            <h2 className="m-0 text-[29px] leading-[1.15] tracking-[-0.012em] sm:text-[33px]">
              {title}
            </h2>
            <p className="m-0 mt-2 text-lg text-primary-foreground/95">
              {children ?? "I’ll build yours first. You only pay if you love it."}
            </p>
          </div>
        </div>
        <Link
          href="/contact"
          className={`${HOME_BTN_LIGHT} ${BTN_LG} w-full text-lg sm:w-auto sm:whitespace-nowrap`}
        >
          Request your free preview
        </Link>
      </div>
    </section>
  )
}
