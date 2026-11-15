import { Polaroid } from "./founder-avatar"
import {
  HOME_CARD,
  HOME_CONTAINER,
  HOME_KICKER,
  LETTER_EM,
  LETTER_H2,
  LETTER_HAND,
  LETTER_PAGE_H1,
  SectionIntro,
  Stars,
} from "./home-shared"
import { ReviewCard } from "./home-social"
import { GOOGLE_REVIEWS } from "./site-data"

const BIO_PARAGRAPHS = [
  "I spent most of my professional life working in the NHS. My time handling clinical research and governance taught me how to tackle complex problems with real care.",
  "Alongside my NHS career I spent years building websites independently. I built charity platforms and followed self directed design projects wherever they led. Velvet Dinosaur naturally grew from that experience.",
  "When we partner together you deal exclusively with me. We skip the confusing jargon and the usual agency runaround. You just get a beautifully built website managed month to month. Best of all your content and your domain remain entirely yours.",
] as const

const HOW_I_WORK = [
  {
    kicker: "Background",
    title: "NHS-grade rigour",
    body: "Years across medical equipment, clinical research and governance. Complex problems handled with structure and care.",
  },
  {
    kicker: "Builds",
    title: "Built for you first",
    body: "Your new website is designed and built before you pay anything. Try it free for 14 days, then decide.",
  },
  {
    kicker: "Approach",
    title: "Direct and transparent",
    body: "One person, first call to launch and beyond. One flat monthly price, and your content and domain always yours.",
  },
] as const

export function AboutHero() {
  return (
    <section
      className={`${HOME_CONTAINER} flex flex-wrap items-center gap-x-16 gap-y-14 pt-12 sm:pt-[76px]`}
    >
      <div className="min-w-0 flex-[1.3_1_500px]">
        <p className={`${LETTER_HAND} m-0 mb-3 origin-bottom-left -rotate-3 text-[34px]`}>
          A bit about me,
        </p>
        <h1 className={LETTER_PAGE_H1}>
          Websites made by a person, <em className={LETTER_EM}>not a platform.</em>
        </h1>
        <div className="mt-7 flex max-w-[620px] flex-col gap-[18px] text-muted-foreground">
          <p className="m-0 text-[19px] leading-[1.55] text-foreground sm:text-[21px]">
            Hello. I am Ian Wickens and I run Velvet Dinosaur from my home in Minster Lovell,
            near Witney in Oxfordshire. I build managed websites for organisations looking for
            something carefully crafted. I actually build your site before you pay anything at
            all.
          </p>
          {BIO_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="m-0">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-[1_1_340px] justify-center">
        <Polaroid caption="Ian Wickens, Minster Lovell" preload />
      </div>
    </section>
  )
}

export function HowIWork() {
  return (
    <section className={`${HOME_CONTAINER} pt-20 sm:pt-28`}>
      <SectionIntro kicker="Working with me" title="How I work." />
      <div className="mt-11 grid gap-[22px] md:grid-cols-3">
        {HOW_I_WORK.map((card) => (
          <div key={card.title} data-reveal className={`${HOME_CARD} px-[30px] pb-8 pt-[30px]`}>
            <p className={`${HOME_KICKER} m-0 text-accent`}>{card.kicker}</p>
            <h3 className="m-0 mt-2 text-[26px] leading-[1.15]">{card.title}</h3>
            <p className="m-0 mt-2.5 text-[17px] text-muted-foreground">{card.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function GoogleReviews() {
  return (
    <section className="mt-20 border-y border-border bg-muted sm:mt-28">
      <div className={`${HOME_CONTAINER} pb-20 pt-[72px] sm:pb-[100px] sm:pt-24`}>
        <div data-reveal className="mx-auto max-w-[720px] text-center">
          <p className={`${HOME_KICKER} m-0 mb-5 text-accent`}>
            5.0 on Google · independent reviews
          </p>
          <Stars size={24} className="justify-center" />
          <h2 className={`${LETTER_H2} mt-[22px]`}>Kind words from clients.</h2>
        </div>
        <div className="mt-12 grid gap-[22px] md:grid-cols-2">
          {GOOGLE_REVIEWS.map((review) => (
            <ReviewCard key={review.name} review={review} />
          ))}
        </div>
      </div>
    </section>
  )
}
