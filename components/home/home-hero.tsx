import Link from "next/link"
import { ArrowRight, Check, Star } from "lucide-react"

import { Polaroid } from "./founder-avatar"
import {
  BTN_LG,
  HOME_BTN_PRIMARY,
  HOME_CONTAINER,
  HOME_KICKER,
  LETTER_EM,
  LETTER_H1,
  LETTER_HAND,
  LETTER_LEAD,
  LETTER_LINK,
} from "./home-shared"

const PROMISES = [
  "No setup fee",
  "30-day money-back guarantee",
  "Replies within one business day",
] as const

// The opening of the letter. Nothing here animates: the headline and the
// photograph are the first things painted, and they should arrive finished.
export function HomeHero() {
  return (
    <section
      id="home"
      className={`${HOME_CONTAINER} flex flex-wrap items-center gap-x-16 gap-y-14 pb-16 pt-12 sm:pb-[72px] sm:pt-[76px]`}
    >
      <div className="min-w-0 flex-[1.3_1_500px]">
        {/* Says what this is and where, before the letter begins. */}
        <p className={`${HOME_KICKER} m-0 mb-6 text-muted-foreground`}>
          Web design in Witney, Oxfordshire
        </p>
        <p className={`${LETTER_HAND} m-0 mb-3 origin-bottom-left -rotate-3 text-[34px]`}>
          Hello,
        </p>
        <h1 className={LETTER_H1}>
          I’ll build your website first. <em className={LETTER_EM}>You decide after.</em>
        </h1>
        <p className={`${LETTER_LEAD} mt-7 max-w-[570px]`}>
          I’m Ian. I design, build and look after websites for small businesses, charities and
          community groups. You see your finished site before you pay a penny. Love it, and it’s{" "}
          <strong className="font-semibold text-foreground">
            £99 a month with everything included
          </strong>
          . If not, we shake hands and walk away.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-x-[26px] gap-y-4">
          <Link href="/contact" className={`${HOME_BTN_PRIMARY} ${BTN_LG}`}>
            Request your free preview
            <ArrowRight aria-hidden width={20} height={20} strokeWidth={2.2} />
          </Link>
          <Link href="/#how-it-works" className={`${LETTER_LINK} text-[19px]`}>
            Read how it works
          </Link>
        </div>
        <ul className="m-0 mt-10 flex list-none flex-wrap gap-x-[30px] gap-y-3 border-t border-border p-0 pt-[22px] text-base font-medium text-muted-foreground">
          <li className="flex items-center gap-2">
            <Star aria-hidden width={18} height={18} className="fill-current text-star" />
            5.0 on Google
          </li>
          {PROMISES.map((promise) => (
            <li key={promise} className="flex items-center gap-2">
              <Check aria-hidden width={18} height={18} strokeWidth={2.4} className="text-primary" />
              {promise}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex min-w-0 flex-[1_1_340px] justify-center">
        <Polaroid caption="That’s me. One person, start to finish." postmark preload />
      </div>
    </section>
  )
}

const SHORT_VERSION = [
  {
    title: "Built first.",
    body: "You see a working website before you pay anything, and you get fourteen days to try it.",
  },
  {
    title: "£99 a month.",
    body: "Design, build, hosting, updates and support in one flat price. No setup fee.",
  },
  {
    title: "One person.",
    body: "You work directly with me, from the first conversation to launch and long after.",
  },
] as const

/** The whole offer in three lines, for anyone who reads no further. */
export function ShortVersion() {
  return (
    <section aria-label="The short version" className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-[1240px] divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {SHORT_VERSION.map((item) => (
          <div key={item.title} className="px-6 py-8 sm:px-8 md:py-[38px]">
            <p className="m-0 font-serif text-[30px] font-medium italic leading-[1.1] text-accent sm:text-[34px]">
              {item.title}
            </p>
            <p className="m-0 mt-3 max-w-[330px] text-lg text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
