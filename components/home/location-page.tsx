import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { ADDRESS_LINE_1, ADDRESS_LINE_2, MAPS_HREF } from "@/lib/contact-details"
import type { LocationPageContent } from "@/lib/location-pages"
import { siteName } from "@/lib/site-metadata"
import { DesignShell } from "./design-shell"
import { FaqAccordion } from "./faq-accordion"
import { Polaroid } from "./founder-avatar"
import {
  BTN_LG,
  HOME_BTN_PRIMARY,
  HOME_CARD,
  HOME_CONTAINER,
  HOME_KICKER,
  LETTER_COLUMN,
  LETTER_EM,
  LETTER_H2,
  LETTER_HAND,
  LETTER_LEAD,
  LETTER_LINK,
  LETTER_PAGE_H1,
  SectionIntro,
  Stars,
} from "./home-shared"
import { PriceCard } from "./home-pricing"
import { CtaPanel, ReviewCard } from "./home-social"
import { GOOGLE_REVIEWS } from "./site-data"

export function locationMetadata(content: LocationPageContent): Metadata {
  const path = `/${content.slug}`
  return {
    title: content.title,
    description: content.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName,
      title: content.title,
      description: content.description,
    },
  }
}

// A local landing page: the same letter, addressed to one place. The copy
// lives in lib/location-pages.ts.
export function LocationPage({ content }: { content: LocationPageContent }) {
  const reviews = content.reviewNames
    .map((name) => GOOGLE_REVIEWS.find((review) => review.name === name))
    .filter((review) => review !== undefined)

  return (
    <DesignShell>
      <section
        className={`${HOME_CONTAINER} flex flex-wrap items-center gap-x-16 gap-y-14 pt-12 sm:pt-[76px]`}
      >
        <div className="min-w-0 flex-[1.3_1_500px]">
          <p className={`${LETTER_HAND} m-0 mb-3 origin-bottom-left -rotate-3 text-[34px]`}>
            {content.greeting}
          </p>
          <h1 className={LETTER_PAGE_H1}>
            {content.headline[0]} <em className={LETTER_EM}>{content.headline[1]}</em>
          </h1>
          <p className={`${LETTER_LEAD} mt-7 max-w-[590px]`}>{content.lead}</p>
          <div className="mt-9 flex flex-wrap items-center gap-x-[26px] gap-y-4">
            <Link href="/contact" className={`${HOME_BTN_PRIMARY} ${BTN_LG}`}>
              Request your free preview
              <ArrowRight aria-hidden width={20} height={20} strokeWidth={2.2} />
            </Link>
            <Link href="/work" className={`${LETTER_LINK} text-[19px]`}>
              See the work
            </Link>
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_340px] justify-center">
          <Polaroid caption={content.photoCaption} postmark preload />
        </div>
      </section>

      <section className={`${HOME_CONTAINER} pt-20 sm:pt-28`}>
        <SectionIntro kicker={content.reasons.kicker} title={content.reasons.title} />
        <div className="mt-11 grid gap-[22px] md:grid-cols-3">
          {content.reasons.cards.map((card) => (
            <div key={card.title} data-reveal className={`${HOME_CARD} px-[30px] pb-8 pt-[30px]`}>
              <h3 className="m-0 text-[26px] leading-[1.15]">{card.title}</h3>
              <p className="m-0 mt-2.5 text-[17px] text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${HOME_CONTAINER} pt-20 sm:pt-28`}>
        <SectionIntro kicker="What you get" title="One honest price, and everything is in it.">
          You get a fast, secure website that I actively manage for you, the freedom to grow it
          yourself, and direct support from a real person whenever you need help.
        </SectionIntro>
        <PriceCard className="mt-11 sm:mt-[52px]" />
        <p className={`${LETTER_COLUMN} m-0 mt-[30px] text-center`}>
          <Link href="/#how-it-works" className={`${LETTER_LINK} text-[19px]`}>
            Read how it works, step by step
          </Link>
        </p>
      </section>

      <section className={`${HOME_CONTAINER} pt-20 sm:pt-28`}>
        <div data-reveal className={LETTER_COLUMN}>
          <p className={`${HOME_KICKER} m-0 mb-3 text-accent`}>{content.area.kicker}</p>
          <h2 className={LETTER_H2}>{content.area.title}</h2>
          <div className="mt-[22px] flex flex-col gap-[18px] text-muted-foreground">
            {content.area.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="m-0">
                {paragraph}
              </p>
            ))}
          </div>
          <p className={`${HOME_KICKER} m-0 mb-3 mt-9 text-muted-foreground`}>
            {content.area.placesLabel}
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0 text-base">
            {content.area.places.map((place) => (
              <li key={place} className="rounded-full border border-border bg-card px-3.5 py-1.5">
                {place}
              </li>
            ))}
          </ul>
          <p className="m-0 mt-9 border-t border-border pt-7 text-muted-foreground">
            <strong className="font-semibold text-foreground">Velvet Dinosaur</strong>
            <br />
            {ADDRESS_LINE_1}
            <br />
            {ADDRESS_LINE_2}
            <br />
            <a href={MAPS_HREF} target="_blank" rel="noopener noreferrer" className={LETTER_LINK}>
              Open in Google Maps
            </a>
          </p>
        </div>
      </section>

      <section className="mt-20 border-y border-border bg-muted sm:mt-28">
        <div className={`${HOME_CONTAINER} pb-20 pt-[72px] sm:pb-[100px] sm:pt-24`}>
          <div data-reveal className="mx-auto max-w-[720px] text-center">
            <p className={`${HOME_KICKER} m-0 mb-5 text-accent`}>
              5.0 on Google · independent reviews
            </p>
            <Stars size={24} className="justify-center" />
            <h2 className={`${LETTER_H2} mt-[22px]`}>Kind words from clients.</h2>
          </div>
          <div className="mt-12 grid gap-[22px] lg:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={review.name} review={review} />
            ))}
          </div>
        </div>
      </section>

      <section className={`${HOME_CONTAINER} pt-20 sm:pt-[104px]`}>
        <div className={LETTER_COLUMN}>
          <p className={`${HOME_KICKER} m-0 mb-3 text-accent`}>Questions</p>
          <h2 className={`${LETTER_H2} mb-[30px]`}>Questions people usually ask.</h2>
          <FaqAccordion faqs={content.faqs} />
        </div>
      </section>

      <CtaPanel title={content.ctaTitle} />
    </DesignShell>
  )
}
