import Link from "next/link"
import { Package, RefreshCw, ShieldCheck, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  BTN_LG,
  CheckItem,
  HOME_BTN_LIGHT,
  HOME_CARD,
  HOME_CONTAINER,
  HOME_KICKER,
  LETTER_COLUMN,
  SectionIntro,
} from "./home-shared"

const TERMS = [
  "No setup fee",
  "12-month minimum, paid monthly",
  "Then rolling, with 30 days’ notice",
] as const

const INCLUDED = [
  "Custom design and build",
  "Hosting, SSL and daily backups",
  "Sauro CMS, so you can edit it yourself",
  "Software updates and maintenance",
  "Email for your domain",
  "Small content changes done for you",
  "A booking system and contact forms",
  "Version history to undo mistakes",
] as const

const CAN_ALSO_INCLUDE = [
  "Online booking",
  "News or blog posts",
  "Email newsletter",
  "Events and registrations",
  "Online payments or a shop",
  "Google reviews",
  "Instagram and Facebook posts",
  "Photo galleries",
  "Logins for your team",
] as const

const PROMISES: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: ShieldCheck,
    title: "30-day money-back guarantee",
    body: "Your first thirty days after launch are covered. If the site is not right for your business, I refund everything you paid.",
  },
  {
    icon: RefreshCw,
    title: "A free redesign when you renew",
    body: "Renew for another twelve months and I refresh your design completely free. Your content and settings stay exactly as they are.",
  },
  {
    icon: Package,
    title: "Yours to keep, free to leave",
    body: "You own your domain and your content from day one. You are free to leave after your first year, and I will help you pack up and move.",
  },
]

/** The offer in one card: the price on navy, everything it covers beside it. */
export function PriceCard({ id, className }: { id?: string; className?: string }) {
  return (
    <div
      id={id}
      data-reveal
      className={cn(
        "flex flex-wrap overflow-hidden rounded-lg border border-border shadow-[var(--vd-shadow-card)]",
        className,
      )}
    >
      <div className="flex flex-[1_1_340px] flex-col bg-primary px-7 pb-9 pt-10 text-primary-foreground sm:px-[42px] sm:pb-[42px] sm:pt-[46px]">
        <p className={`${HOME_KICKER} m-0 text-primary-foreground/95`}>
          Your website, built before you pay
        </p>
        <p className="m-0 mt-[30px] font-serif text-[104px] font-medium leading-[0.9] tracking-[-0.03em] sm:text-[124px]">
          £99
        </p>
        <p className="m-0 mt-1.5 font-serif text-[26px] italic leading-[1.2] sm:text-[28px]">
          a month, everything included
        </p>
        <ul className="m-0 mt-7 flex list-none flex-col gap-[9px] border-t border-primary-foreground/30 p-0 pt-[22px] text-lg text-primary-foreground/90">
          {TERMS.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>
        <Link href="/contact" className={`${HOME_BTN_LIGHT} ${BTN_LG} mt-8 text-lg`}>
          Request your free preview
        </Link>
        <Link
          href="/agreement"
          className="mt-[18px] self-center text-base text-primary-foreground underline underline-offset-4 hover:text-primary-foreground hover:decoration-2"
        >
          Read the full service agreement
        </Link>
      </div>
      <div className="flex-[1.6_1_440px] bg-card px-7 pb-9 pt-10 sm:px-11 sm:pb-[42px] sm:pt-[46px]">
        <h3 className="m-0 text-[28px] leading-[1.15] tracking-[-0.01em] sm:text-[30px]">
          Included with every site
        </h3>
        <ul className="m-0 mt-[22px] grid list-none grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))] gap-x-8 gap-y-3.5 p-0 text-lg">
          {INCLUDED.map((item) => (
            <CheckItem key={item}>{item}</CheckItem>
          ))}
        </ul>
        <p className={`${HOME_KICKER} m-0 mb-3 mt-[34px] border-t border-border pt-[26px] text-muted-foreground`}>
          Your site can also include
        </p>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0 text-base">
          {CAN_ALSO_INCLUDE.map((item) => (
            <li
              key={item}
              className="rounded-full border border-border bg-background px-3.5 py-1.5"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function HomePricing() {
  return (
    <section
      id="what-you-get"
      className={`${HOME_CONTAINER} scroll-mt-20 pt-20 sm:pt-28`}
    >
      <SectionIntro
        kicker="Part two · What you get"
        title="One honest price, and everything is in it."
      >
        You get much more than a pretty design. You get a fast, secure website that I actively
        manage for you, the freedom to grow it yourself, and direct support from a real person
        whenever you need help.
      </SectionIntro>

      <PriceCard id="pricing" className="mt-11 scroll-mt-24 sm:mt-[52px]" />

      <div className="mt-[22px] grid gap-[22px] md:grid-cols-3">
        {PROMISES.map((promise) => (
          <div key={promise.title} data-reveal className={`${HOME_CARD} px-[30px] pb-8 pt-[30px]`}>
            <promise.icon aria-hidden width={30} height={30} strokeWidth={1.7} className="text-primary" />
            <h3 className="m-0 mt-3.5 text-[26px] leading-[1.15]">{promise.title}</h3>
            <p className="m-0 mt-2.5 text-[17px] text-muted-foreground">{promise.body}</p>
          </div>
        ))}
      </div>
      <p className={`${LETTER_COLUMN} m-0 mt-[30px] text-balance text-center font-serif text-[21px] italic text-muted-foreground`}>
        For comparison, a typical agency build costs £3,500 or more up front, before hosting and
        maintenance.
      </p>
    </section>
  )
}
